-- 결제 우회 차단.
--
-- 1) public.users.tier
--    클라이언트(authenticated/anon)는 절대 변경 불가.
--    service_role(결제 webhook, 대시보드 SQL/Table Editor)에서만 변경 가능.
--
-- 2) public.users.home_country_changed
--    false→true 한 방향만 허용.
--    클라이언트가 자기 본국을 처음 변경할 때 markHomeCountryChangedInDb로
--    true를 쓰는 흐름은 그대로 동작하고, true→false로 되돌려 "본국 1회 변경"
--    제약을 무한 우회하는 시도만 raise한다.
--
-- 검증:
--   일반 로그인 세션에서
--     update users set tier = 2 where id = auth.uid()
--   → "permission denied for column tier" 떠야 OK.
--     update users set home_country_changed = false where id = auth.uid()
--   → "home_country_changed cannot revert to false" 떠야 OK.

revoke update (tier) on public.users from authenticated;
revoke update (tier) on public.users from anon;

create or replace function public.users_home_changed_one_way()
returns trigger
language plpgsql
as $$
begin
  if old.home_country_changed = true and new.home_country_changed = false then
    raise exception 'home_country_changed cannot revert to false';
  end if;
  return new;
end;
$$;

drop trigger if exists users_home_changed_one_way on public.users;

create trigger users_home_changed_one_way
  before update on public.users
  for each row
  execute function public.users_home_changed_one_way();
