-- 비행시작 기능 평생 무료 권한 플래그.
-- 향후 유료 전환 시점에 기존 가입자에게 일괄 부여하기 위한 컬럼.
-- 부여 방법: 유료 전환하는 날
--   UPDATE public.users SET flight_start_lifetime_free = true WHERE created_at < now();
-- 부여 사유까지 추적해야 한다면 boolean → text('grandfathered'|'cs_compensation'|...)로 확장.

alter table public.users
  add column flight_start_lifetime_free boolean not null default false;

comment on column public.users.flight_start_lifetime_free is
  '비행시작 기능 평생 무료 권한. 유료 전환 전 가입자에게 일괄 부여하기 위한 플래그.';
