-- 사용자 닉네임 추가.
--
-- 추후 커뮤니티 기능 등에서 사용자를 식별하기 위한 표시 이름이다.
-- 중복 체크는 하지 않으므로 unique 제약은 걸지 않는다.
-- 길이/공백 제약은 클라이언트에서 검증하고, DB에서는 길이만 가볍게 막아둔다
-- (16자 + 약간의 여유).
--
-- 기존 사용자는 nickname = null 인 상태로 남는다. 온보딩을 이미 완료한 유저에게
-- 다시 묻는 흐름은 이번 마이그레이션 범위 밖이며, 추후 Settings 화면에서
-- 직접 설정/변경할 수 있도록 별도 작업으로 다룬다.

alter table public.users
  add column if not exists nickname text;

alter table public.users
  add constraint users_nickname_length_chk
  check (nickname is null or char_length(nickname) between 1 and 32);
