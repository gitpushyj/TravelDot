-- 국기 퀴즈 1위(전체 최고) 조회용. flag_quiz_scores의 RLS는 본인 한정으로 두고,
-- 1위 카드에 필요한 최소 컬럼(점수/닉네임/국가/user_id/동점자 수)만 SECURITY DEFINER
-- RPC로 노출한다. users 테이블의 birth_year 등 민감 필드는 그대로 보호된다.

-- 1) 1위 조회용 인덱스. best_score 내림차순 + tiebreak로 last_played_at 오름차순.
create index flag_quiz_scores_top_idx
  on public.flag_quiz_scores (best_score desc, last_played_at asc);

-- 2) 1위 1명 + 동점자 수 RPC.
-- nickname IS NULL이거나 home_country_code IS NULL이어도 1위 후보가 된다.
-- 클라이언트가 닉네임 fallback("익명의 여행자") / 국기 숨김을 처리한다.
create function public.get_top_flag_quiz_score()
returns table (
  best_score integer,
  nickname text,
  home_country_code text,
  user_id uuid,
  tied_count integer
)
language sql
security definer
set search_path = ''
as $$
  with top as (
    select s.best_score, s.last_played_at, s.user_id,
           u.nickname, u.home_country_code
    from public.flag_quiz_scores s
    join public.users u on u.id = s.user_id
    where s.best_score > 0
    order by s.best_score desc, s.last_played_at asc
    limit 1
  )
  select t.best_score, t.nickname, t.home_country_code, t.user_id,
         (select count(*)::int - 1
            from public.flag_quiz_scores f
           where f.best_score = t.best_score)
  from top t;
$$;

revoke execute on function public.get_top_flag_quiz_score() from public, anon;
grant  execute on function public.get_top_flag_quiz_score() to authenticated;
