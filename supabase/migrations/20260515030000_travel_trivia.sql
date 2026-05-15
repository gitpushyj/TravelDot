-- 여행 상식 퀴즈 (Travel Trivia).
-- 1) 문제 풀: 한 row = 한 질문. translations jsonb에 {locale: {q,c}} 형태로 모든 언어를 함께 보관.
-- 2) 주간 점수: 국기 퀴즈와 동일한 (user_id, week_start) PK 시즌 모델.
-- 3) RPC: locale별 추출 / 점수 제출 / 내 점수 / 리더보드 / 내 등수.

create table public.travel_trivia_questions (
  id serial primary key,
  category text not null,
  difficulty smallint not null check (difficulty between 1 and 3),
  correct_index smallint not null check (correct_index between 0 and 3),
  -- 형식: {"ko": {"q": "...", "c": ["a","b","c","d"]}, "en": {...}, ...}
  -- 새 언어 추가는 update ... set translations = translations || '{"xx":{...}}' 로 처리한다.
  translations jsonb not null,
  created_at timestamptz not null default now()
);

create index travel_trivia_questions_difficulty_idx
  on public.travel_trivia_questions (difficulty);

alter table public.travel_trivia_questions enable row level security;

-- 누구나(비로그인 포함) 문제 풀을 읽을 수 있어야 한다.
create policy travel_trivia_questions_read_all
  on public.travel_trivia_questions for select
  using (true);

-- 서버단에서 locale별 question·choices를 추출해 평면 row로 반환한다.
-- 해당 locale 키가 없으면 en으로 fallback. 둘 다 없으면 그 행은 제외.
create function public.get_travel_trivia_questions(
  p_locale text default 'ko',
  p_count integer default 100
)
returns table (
  id integer,
  category text,
  difficulty smallint,
  question text,
  choices text[],
  correct_index smallint
)
language sql
stable
as $$
  select
    q.id,
    q.category,
    q.difficulty,
    coalesce(q.translations->p_locale->>'q', q.translations->'en'->>'q') as question,
    array(
      select jsonb_array_elements_text(
        coalesce(q.translations->p_locale->'c', q.translations->'en'->'c')
      )
    ) as choices,
    q.correct_index
  from public.travel_trivia_questions q
  where (q.translations->p_locale->>'q') is not null
     or (q.translations->'en'->>'q') is not null
  order by random()
  limit greatest(p_count, 1);
$$;

grant execute on function public.get_travel_trivia_questions(text, integer) to anon, authenticated;

-- 주간 점수 테이블 (flag_quiz와 동일 패턴)
create table public.travel_trivia_weekly_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  best_score integer not null default 0 check (best_score >= 0),
  last_score integer not null default 0 check (last_score >= 0),
  last_played_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.travel_trivia_weekly_scores enable row level security;

create policy travel_trivia_weekly_scores_select_self
  on public.travel_trivia_weekly_scores for select
  using (auth.uid() = user_id);

create policy travel_trivia_weekly_scores_insert_self
  on public.travel_trivia_weekly_scores for insert
  with check (auth.uid() = user_id);

create policy travel_trivia_weekly_scores_update_self
  on public.travel_trivia_weekly_scores for update
  using (auth.uid() = user_id);

create index travel_trivia_weekly_scores_top_idx
  on public.travel_trivia_weekly_scores (week_start, best_score desc, last_played_at asc);

create function public.submit_travel_trivia_score(p_score integer)
returns table (best_score integer, last_score integer)
language sql
as $$
  with wk as (
    select (date_trunc('week', (now() at time zone 'Asia/Seoul')) at time zone 'Asia/Seoul')::date as week_start
  )
  insert into public.travel_trivia_weekly_scores (user_id, week_start, best_score, last_score, last_played_at, updated_at)
  select auth.uid(), wk.week_start, p_score, p_score, now(), now() from wk
  on conflict (user_id, week_start) do update set
    last_score = excluded.last_score,
    best_score = greatest(public.travel_trivia_weekly_scores.best_score, excluded.last_score),
    last_played_at = excluded.last_played_at,
    updated_at = now()
  returning travel_trivia_weekly_scores.best_score, travel_trivia_weekly_scores.last_score;
$$;

grant execute on function public.submit_travel_trivia_score(integer) to authenticated;

create function public.get_my_travel_trivia_score()
returns table (best_score integer, last_score integer)
language sql
security definer
set search_path = ''
as $$
  with wk as (
    select (date_trunc('week', (now() at time zone 'Asia/Seoul')) at time zone 'Asia/Seoul')::date as week_start
  )
  select coalesce(s.best_score, 0), coalesce(s.last_score, 0)
  from wk
  left join public.travel_trivia_weekly_scores s
    on s.user_id = auth.uid() and s.week_start = wk.week_start
  where auth.uid() is not null;
$$;

revoke execute on function public.get_my_travel_trivia_score() from public, anon;
grant  execute on function public.get_my_travel_trivia_score() to authenticated;

create function public.get_travel_trivia_leaderboard(p_limit integer)
returns table (
  rank integer,
  best_score integer,
  nickname text,
  home_country_code text,
  user_id uuid
)
language sql
security definer
set search_path = ''
as $$
  with wk as (
    select (date_trunc('week', (now() at time zone 'Asia/Seoul')) at time zone 'Asia/Seoul')::date as week_start
  ), ranked as (
    select dense_rank() over (order by s.best_score desc, s.last_played_at asc)::int as rank,
           s.best_score, u.nickname, u.home_country_code, s.user_id, s.last_played_at
    from public.travel_trivia_weekly_scores s
    join public.users u on u.id = s.user_id, wk
    where s.week_start = wk.week_start and s.best_score > 0
  )
  select rank, best_score, nickname, home_country_code, user_id
  from ranked
  order by rank asc, last_played_at asc
  limit p_limit;
$$;

revoke execute on function public.get_travel_trivia_leaderboard(integer) from public, anon;
grant  execute on function public.get_travel_trivia_leaderboard(integer) to authenticated;

create function public.get_my_travel_trivia_rank()
returns table (rank integer, best_score integer)
language sql
security definer
set search_path = ''
as $$
  with wk as (
    select (date_trunc('week', (now() at time zone 'Asia/Seoul')) at time zone 'Asia/Seoul')::date as week_start
  ), ranked as (
    select dense_rank() over (order by s.best_score desc, s.last_played_at asc)::int as rank,
           s.best_score, s.user_id
    from public.travel_trivia_weekly_scores s, wk
    where s.week_start = wk.week_start and s.best_score > 0
  )
  select rank, best_score from ranked where user_id = auth.uid();
$$;

revoke execute on function public.get_my_travel_trivia_rank() from public, anon;
grant  execute on function public.get_my_travel_trivia_rank() to authenticated;
