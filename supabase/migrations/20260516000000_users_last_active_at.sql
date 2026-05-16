-- 사용자가 앱을 최근에 켠 시점을 기록한다.
-- auth.users.last_sign_in_at은 토큰 발급(재로그인) 시점만 갱신되므로
-- 자동 로그인 사용자의 실제 활동 시점을 추적할 수 없다.
-- 클라이언트가 앱 시작 + foreground 진입 시 30분 throttle로 갱신한다.
alter table public.users
  add column if not exists last_active_at timestamptz default now();

comment on column public.users.last_active_at is
  '앱이 마지막으로 active 상태로 진입한 시점. 클라이언트에서 30분 throttle로 갱신.';
