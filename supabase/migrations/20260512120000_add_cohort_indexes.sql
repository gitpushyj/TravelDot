-- cohort 비교 통계용 인덱스.
--
-- 추후 "한국인 중 상위 %", "또래(±N년) 중 상위 %", "어느 나라가 인기"
-- 같은 통계 쿼리에서 cohort 필터링을 풀스캔 없이 처리하기 위함.
--
-- 모두 partial index — NULL/삭제된 행은 색인에서 빠져 더 가볍다.

create index if not exists users_home_country_idx
  on public.users(home_country_code)
  where home_country_code is not null;

create index if not exists users_birth_year_idx
  on public.users(birth_year)
  where birth_year is not null;

create index if not exists trips_country_idx
  on public.trips(country_code)
  where deleted_at is null;
