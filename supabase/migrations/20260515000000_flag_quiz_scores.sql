-- 국기 퀴즈 게임 점수.
-- 사용자당 정확히 1행. 게임 기록 히스토리는 저장하지 않고 역대 최고(best)와
-- 최신(last) 점수만 유지한다. 향후 커뮤니티 리더보드의 소스가 된다.
-- 본인 행만 select/insert/update 가능. 리더보드용 전체 read 정책은
-- 커뮤니티 기능 작업 때 별도 마이그레이션으로 추가한다.

create table public.flag_quiz_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  best_score integer not null default 0 check (best_score >= 0),
  last_score integer not null default 0 check (last_score >= 0),
  last_played_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.flag_quiz_scores enable row level security;

create policy flag_quiz_scores_select_self
  on public.flag_quiz_scores for select
  using (auth.uid() = user_id);

create policy flag_quiz_scores_insert_self
  on public.flag_quiz_scores for insert
  with check (auth.uid() = user_id);

create policy flag_quiz_scores_update_self
  on public.flag_quiz_scores for update
  using (auth.uid() = user_id);

-- 게임 종료 점수 제출. 단일 호출로 last는 항상 갱신, best는 greatest로 갱신한다.
-- security invoker(기본)로 두어 RLS 정책(본인 행)이 그대로 적용된다.
create function public.submit_flag_quiz_score(p_score integer)
  returns table (best_score integer, last_score integer)
  language sql
as $$
  insert into public.flag_quiz_scores (user_id, best_score, last_score, last_played_at, updated_at)
  values (auth.uid(), p_score, p_score, now(), now())
  on conflict (user_id) do update set
    last_score = excluded.last_score,
    best_score = greatest(public.flag_quiz_scores.best_score, excluded.last_score),
    last_played_at = excluded.last_played_at,
    updated_at = now()
  returning flag_quiz_scores.best_score, flag_quiz_scores.last_score;
$$;

grant execute on function public.submit_flag_quiz_score(integer) to authenticated;
