-- AI 채팅 일일 사용량 카운터.
-- KST 자정 기준 day로 그룹. service_role(Edge Function)만 변경, 클라는 본인 행 select만 가능.

create table public.ai_chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day_kst date not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day_kst)
);

alter table public.ai_chat_usage enable row level security;

create policy ai_chat_usage_select_self
  on public.ai_chat_usage for select
  using (auth.uid() = user_id);

-- insert/update는 정책 없음 → service_role만 가능.

create index ai_chat_usage_user_day_idx
  on public.ai_chat_usage (user_id, day_kst desc);
