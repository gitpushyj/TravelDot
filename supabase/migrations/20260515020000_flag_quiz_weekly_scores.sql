-- 국기 퀴즈를 시즌(주간)제로 변경.
-- 기존 flag_quiz_scores(누적 best 1행)를 폐기하고, (user_id, week_start) PK의
-- 주차별 점수 테이블로 대체. 매주 KST 월요일 00:00에 시즌이 자동 시작된다
-- (해당 주차에 첫 제출이 들어오면 새 행 생성). 과거 시즌 점수는 그대로 보존된다.

-- 1) 새 테이블
create table public.flag_quiz_weekly_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null, -- KST 기준 그 주의 월요일 (date_trunc('week', now() at time zone 'Asia/Seoul'))
  best_score integer not null default 0 check (best_score >= 0),
  last_score integer not null default 0 check (last_score >= 0),
  last_played_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.flag_quiz_weekly_scores enable row level security;

create policy flag_quiz_weekly_scores_select_self
  on public.flag_quiz_weekly_scores for select
  using (auth.uid() = user_id);

create policy flag_quiz_weekly_scores_insert_self
  on public.flag_quiz_weekly_scores for insert
  with check (auth.uid() = user_id);

create policy flag_quiz_weekly_scores_update_self
  on public.flag_quiz_weekly_scores for update
  using (auth.uid() = user_id);

-- 2) 주차별 리더보드 prefix 스캔용 인덱스.
create index flag_quiz_weekly_scores_top_idx
  on public.flag_quiz_weekly_scores (week_start, best_score desc, last_played_at asc);

-- 3) 기존 누적 데이터를 이번 주 시즌으로 이관.
insert into public.flag_quiz_weekly_scores (user_id, week_start, best_score, last_score, last_played_at, updated_at)
select user_id,
       (date_trunc('week', (now() at time zone 'Asia/Seoul')) at time zone 'Asia/Seoul')::date,
       best_score, last_score, last_played_at, updated_at
from public.flag_quiz_scores
on conflict (user_id, week_start) do nothing;

-- 4) 기존 RPC + 테이블 폐기.
drop function if exists public.get_top_flag_quiz_score();
drop function if exists public.submit_flag_quiz_score(integer);
drop table if exists public.flag_quiz_scores;

-- 5) 점수 제출 RPC. 이번 주 (user_id, week_start) 행에 upsert.
-- security invoker(기본)로 RLS(본인 행) 적용.
create function public.submit_flag_quiz_score(p_score integer)
returns table (best_score integer, last_score integer)
language sql
as $$
  with wk as (
    select (date_trunc('week', (now() at time zone 'Asia/Seoul')) at time zone 'Asia/Seoul')::date as week_start
  )
  insert into public.flag_quiz_weekly_scores (user_id, week_start, best_score, last_score, last_played_at, updated_at)
  select auth.uid(), wk.week_start, p_score, p_score, now(), now() from wk
  on conflict (user_id, week_start) do update set
    last_score = excluded.last_score,
    best_score = greatest(public.flag_quiz_weekly_scores.best_score, excluded.last_score),
    last_played_at = excluded.last_played_at,
    updated_at = now()
  returning flag_quiz_weekly_scores.best_score, flag_quiz_weekly_scores.last_score;
$$;

-- 6) 이번 주 본인 점수 조회 RPC.
-- 행이 없으면 best=0/last=0 반환 (편의상). 비로그인은 NULL auth.uid()로 결과 없음.
create function public.get_my_flag_quiz_score()
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
  left join public.flag_quiz_weekly_scores s
    on s.user_id = auth.uid() and s.week_start = wk.week_start
  where auth.uid() is not null;
$$;

revoke execute on function public.get_my_flag_quiz_score() from public, anon;
grant  execute on function public.get_my_flag_quiz_score() to authenticated;

-- 7) 이번 주 리더보드 RPC. dense_rank로 동점자 같은 등수.
-- p_limit으로 시작화면(3)과 순위화면(100)을 모두 처리한다.
create function public.get_flag_quiz_leaderboard(p_limit integer)
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
    from public.flag_quiz_weekly_scores s
    join public.users u on u.id = s.user_id, wk
    where s.week_start = wk.week_start and s.best_score > 0
  )
  select rank, best_score, nickname, home_country_code, user_id
  from ranked
  order by rank asc, last_played_at asc
  limit p_limit;
$$;

revoke execute on function public.get_flag_quiz_leaderboard(integer) from public, anon;
grant  execute on function public.get_flag_quiz_leaderboard(integer) to authenticated;

-- 8) 이번 주 본인 등수 조회 RPC. 100위 밖이거나 비포함이면 본인 행을 따로 표시하기 위함.
create function public.get_my_flag_quiz_rank()
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
    from public.flag_quiz_weekly_scores s, wk
    where s.week_start = wk.week_start and s.best_score > 0
  )
  select rank, best_score from ranked where user_id = auth.uid();
$$;

revoke execute on function public.get_my_flag_quiz_rank() from public, anon;
grant  execute on function public.get_my_flag_quiz_rank() to authenticated;
