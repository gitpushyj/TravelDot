# AI 여행 친구 (AI 탭) 디자인

날짜: 2026-05-08
대상 화면: `src/screens/AiScreen.tsx`
관련 인프라: Supabase Edge Functions, Supabase `users.tier`, OpenAI Responses API

## 1. 목적

AI 탭에서 사용자가 자연어로 질문하면 자기 여행 데이터(방문국·기간·메모)와 프로필을 컨텍스트로 받은 LLM이 개인화된 답변을 주는 채팅 화면을 제공한다. "다음 여행지 추천", "이번에 갈 나라 안전한가", "내 여행 패턴 분석" 같은 것이 자연스럽게 동작해야 한다.

## 2. 사용자 흐름

1. 바텀탭 "AI" 진입 → `AiScreen` 표시.
2. 첫 진입(메시지 0개) 시 빈 상태: "여행 친구에게 물어보세요" 안내 + 예시 질문 칩 3개. 칩 탭 시 입력창에 채워짐(전송은 사용자가).
3. 사용자가 입력창에 메시지 입력(최대 500자) → 전송.
4. 사용자 말풍선 즉시 추가 + 하단 "타이핑 중…" 인디케이터.
5. Edge Function이 응답 → 어시스턴트 말풍선으로 렌더. 응답에 이미지 URL이 포함되면 버블 안에 inline 표시(최대 4장).
6. 헤더 우측 "대화 비우기" 아이콘으로 현재 사용자의 대화 메모리 초기화 가능.
7. 일일 한도 초과 시 입력창 위에 "오늘 한도를 다 쓰셨어요. 등급: <free/premium/power>" 안내 배너.

## 3. 아키텍처

```
AiScreen
  └─ AiChatList
  └─ AiChatComposer
       │ send(messages, newText)
       ▼
  aiChatStore (Zustand)
       │
       ▼
  aiChatStorage  ←→ AsyncStorage (key: ai_chat:<userId>)
       │
       ▼
  aiChatClient.send()  → POST  Edge Function `ai-chat`
                                 ├─ JWT 검증 → user_id
                                 ├─ public.users.tier 조회 → 한도 결정
                                 ├─ ai_chat_usage 조회/증가 → 한도 검사
                                 ├─ public.trips 조회 → system prompt 조립
                                 └─ OpenAI Responses API 호출 (web_search tool)
                                            ▼
                                   응답 본문(JSON) 반환
```

키는 Supabase secret(`OPENAI_API_KEY`)에만 존재. 클라 번들에는 절대 들어가지 않는다.

## 4. 데이터 모델

### 4.1 클라 메시지 타입 (`src/features/aiChat/types.ts`)

```ts
export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;                 // 클라 생성 uuid
  role: ChatRole;
  text: string;
  createdAt: number;          // ms epoch
  imageUrls?: string[];       // assistant 메시지에 한해. 최대 4장.
  error?: string;             // assistant 응답 실패 시
};
```

### 4.2 대화 메모리 (AsyncStorage)

- 키: `ai_chat:<userId>` (사용자 분리)
- 값: `JSON.stringify(ChatMessage[])`
- **sliding window 길이는 tier별로 다르다** — `MEMORY_BY_TIER`(일일 한도와 동일):
  - `free`: 1
  - `premium`: 10
  - `power`: 30
- 저장 직전 + store에 set할 때마다 `slice(-cap)` 적용. UI 표시되는 메시지 = 메모리 = LLM 컨텍스트가 모두 같은 cap을 따른다(=일관).
- 저장 시점: 매 메시지 추가 후 즉시.
- 로그아웃(`signOut`) 시 해당 키 삭제.
- 사용자가 "대화 비우기" 누르면 키 삭제.
- tier 변경 감지: store는 hydrate 시점에 `fetchUserTier`로 한 번 fetch + 매 응답의 `usage.tier`로 동기화. tier가 올라가면 다음 메시지부터 새 cap 적용, tier가 내려가면 즉시 잘려서 표시된다.

전송 시 Edge Function에는 저장된 (`cap`개) + 신규 user 메시지를 함께 보낸다.

### 4.3 Supabase 테이블 신설: `ai_chat_usage`

```sql
create table public.ai_chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day_kst date not null,           -- KST 자정 기준 날짜
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day_kst)
);

alter table public.ai_chat_usage enable row level security;

-- 본인 행 조회만 허용. 변경은 service_role(Edge Function)만.
create policy ai_chat_usage_select_self
  on public.ai_chat_usage for select
  using (auth.uid() = user_id);

-- insert/update는 클라가 직접 못 함. Edge Function이 service_role로만.
```

증가 패턴은 Edge Function의 단일 RPC에서 `upsert ... + count = count + 1`로 원자적으로.

### 4.4 system prompt 컨텍스트 (Edge Function이 매 요청마다 조립)

```text
You are VisitGrid's personal travel companion for this user.
Reply in the user's app language: <lang>.
Talk to the user like a close friend (casual, warm, second-person).
Match the casual register of their app language.
Always ground every answer in the user's profile and travel history below.
Your goal is to be genuinely helpful to this specific traveler — take it seriously.
Use the web_search tool ONLY when the question depends on time-sensitive,
real-world facts (current safety/geopolitics, visa rules, weather windows,
prices). Do NOT search for general advice the user already implies.
When you reference a place that benefits from a photo or map image, you
MAY include up to 4 https image URLs in your reply as markdown
(`![alt](https://...)`). The client renders them inline.

ABOUT VISITGRID  (the app the user is using right now)
VisitGrid is a personal world-travel tracker. The user logs trips
(country + date range + optional memo) and the home screen paints
every visited country onto a world dot-map — kind of like filling in
a heatmap of the planet. Their home country gets its own color, and
visit-count milestones unlock honorific titles. Users naturally think
of new destinations as 'adding a new color/dot to my map'.
When it fits naturally, lean into this metaphor — e.g. 'that one would
add a fresh dot to your map', 'still a blank spot for you' — but don't
force it into every answer.

USER PROFILE
- app language: <lang>
- age: <만 나이>          (생년월일 미상이면 줄 자체 생략)
- gender: <male|female|other>   (미상 또는 prefer_not_to_say면 줄 자체 생략)
- home country: <ISO alpha-2> (미설정이면 줄 자체 생략) — 출발지 항공편/비자/면세 등 답변에 사용

USER COUNTRY STATS  (top 30 by visit count)
| code | visits | first_visit | last_visit | total_days |
|------|--------|-------------|------------|------------|
| ...  | ...    | ...         | ...        | ...        |

TRIPS  (all, up to 200, newest first; memo truncated to 50 chars)
- 2024-08-19 ~ 2024-08-19  JP  "오사카 다코야키 투어 — 첫째 날부터 비가 와…"
- 2024-07-03 ~ 2024-07-05  TH
- ...
```

> **참고:** 인증 제공자(google/apple)와 계정 등급(tier)은 LLM에게 도움 안 되는 메타데이터라 system prompt에서 빼두었다(tier는 서버 한도 결정에만 사용).

**조립 절차**

1. service_role client로 본인 user의 `trips` 최근 200건 조회 (`deleted_at is null`, `start_date desc`).
2. 같은 200건을 country_code 기준 group → `(visits, first_visit=min(start_date), last_visit=max(start_date), total_days=Σ(end-start+1))` 계산 → 방문 횟수 desc 상위 30개를 `USER COUNTRY STATS`에 채운다.
3. 같은 200건 전체를 `start_date desc` 정렬해 `TRIPS` 섹션에 한 줄씩 채운다.
   - 형식: `- {start_date} ~ {end_date}  {country_code}  "{memo50}"`
   - `memo50`은 `body`의 앞 50자만 사용. 50자 초과 시 끝에 `…` (U+2026) 한 글자 추가.
   - `body`가 `null`이거나 trim 후 빈 문자열이면 메모 부분(공백 두 칸 + 따옴표 블록) 자체를 생략한다.
4. 200건 미만이면 있는 만큼만 채운다. 0건이면 "USER has no trips yet." 한 줄로 대체한다.

> 메모 truncate는 글자(JS code unit) 기준이 아닌 **Array.from(body)의 codepoint 단위**로 자른다(이모지·결합 문자 안전).

## 5. UI

### 5.1 화면 구조

```
AiScreen (root)
  ├─ Header
  │   ├─ 타이틀 "AI"
  │   └─ 우측 아이콘: 대화 비우기 (Trash2)
  ├─ 한도 초과 시: UsageLimitBanner
  ├─ AiChatList (inverted FlatList)
  │   └─ AiChatBubble × N
  └─ AiChatComposer (하단 고정, KeyboardAvoidingView)
```

빈 상태일 때 `AiChatList` 자리에 `AiChatEmptyState` 표시.

### 5.2 컴포넌트 책임

- **`AiChatBubble.tsx`** — role에 따라 좌/우 정렬, 색상. assistant 메시지 안의 텍스트는 줄바꿈 보존. `imageUrls`가 있으면 텍스트 하단에 `Image` 그리드(1~4장, 둥근 모서리). 이미지 탭 시 `ImageDetailScreen`으로 navigate.
- **`AiChatList.tsx`** — `inverted FlatList`. 자동 스크롤은 `inverted` 특성상 새 메시지 추가 시 하단(=리스트 시각적 상단) 자동 노출.
- **`AiChatComposer.tsx`** — multi-line `TextInput`(최대 5줄까지 자동 확장), 글자수 카운터(`{n}/500`), 전송 버튼(텍스트 비어있으면 disabled, 전송 중이면 ActivityIndicator). 한도 초과 상태면 입력·전송 모두 disabled.
- **`AiChatEmptyState.tsx`** — 안내 문구 + 예시 칩 3개. 칩 탭 시 `composerRef.setText(chip)` 호출(자동 전송 X).
- **`UsageLimitBanner.tsx`** — 빨간 톤. "오늘 한도를 다 쓰셨어요" + tier 라벨 + (free/premium만) "등급을 올리면 더 많이 쓸 수 있어요" 한 줄.

### 5.3 예시 질문 칩 (i18n 키)

말투는 **친구에게 대화하듯**한 톤으로 통일(반말/캐주얼). 각 언어로 자연스러운 친구체로 번역한다.

| i18n 키 | 한국어 (ko) | 영어 (en) |
|---------|-------------|-----------|
| `aiChat.exampleNextDestination` | 다음 여행지는 어디가 좋을까? | Where should I go next? |
| `aiChat.exampleSafety` | 요즘 안전한 여행지 어디야? | Where's safe to travel right now? |
| `aiChat.examplePattern` | 내 여행 스타일 어떤 거 같아? | What's my travel vibe? |

system prompt에도 톤 가이드 한 줄을 추가한다: "Talk to the user like a close friend (casual, warm, second-person). Match the casual register of their app language."

### 5.4 이미지 inline 렌더 규칙

- AI 응답 텍스트에서 정규식으로 markdown 이미지 추출: `/!\[[^\]]*\]\((https:\/\/[^)\s]+)\)/g`
- 추출된 URL 중 https만, 최대 4개만 채택. 본문에서는 해당 markdown 토큰을 제거(중복 노출 방지).
- 추출된 URL은 `imageUrls` 필드로, 정리된 텍스트는 `text`로 저장.
- 렌더 시 1장이면 16:9, 2~4장이면 그리드(1행 2열, 2행 2열). 둥근 코너 12.
- 로드 실패 시 "이미지를 불러올 수 없어요" placeholder.

## 6. Edge Function 인터페이스

### 6.1 디렉터리·환경변수

```
supabase/functions/ai-chat/
  ├─ index.ts
  └─ deno.jsonc      (필요 시)
```

환경변수(Supabase secret):
- `OPENAI_API_KEY` (필수, 사용자가 직접 등록)
- `OPENAI_MODEL` (선택, default `gpt-5.4-mini`)
- 자동 주입: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`

### 6.2 요청/응답

**요청**
```http
POST /functions/v1/ai-chat
Authorization: Bearer <user JWT>
Content-Type: application/json

{
  "messages": [
    { "role": "user", "text": "다음 여행지 추천해줘" }
  ]
}
```

`messages`는 클라가 가진 sliding window 전체(최근 10개 + 신규 1개)를 그대로 전달. id/createdAt은 보내지 않음.

**응답 (200)**
```json
{
  "assistant": {
    "text": "최근 5번 방문이 동남아에 몰려 있어요. 이번엔 ...",
    "imageUrls": ["https://..."]
  },
  "usage": { "tier": "free", "usedToday": 1, "limit": 1 }
}
```

**에러 응답**
- `401` — JWT 없음/유효하지 않음 → 클라에서 로그인 화면 안내.
- `429` — 일일 한도 초과 → 응답 body `{ error: "rate_limited", tier, limit }`.
- `400` — 입력 검증 실패(메시지 길이/개수). body `{ error: "invalid_input", reason }`.
- `502` — 모델 호출 실패. body `{ error: "upstream_error" }`. 원본 OpenAI 에러는 마스킹.
- `500` — 그 외. body `{ error: "internal" }`.

### 6.3 처리 흐름

1. JWT에서 user_id 추출 (`createClient(...).auth.getUser(jwt)`).
2. 입력 검증:
   - `messages.length` 1~11
   - 각 `text.length` ≤ 500
   - 마지막 메시지의 `role === "user"`
3. `users.tier` 조회 → 한도 결정 (4장 표).
4. `ai_chat_usage` 조회: KST 오늘자 row 없으면 0, 있으면 count.
5. `count >= limit` → `429`.
6. system prompt 조립 (§4.4 절차 그대로).
7. OpenAI Responses API 호출:
   ```ts
   {
     model: OPENAI_MODEL,
     input: [{ role: "system", content: systemPrompt }, ...userMessages],
     tools: [{ type: "web_search" }],
     max_output_tokens: 1000
   }
   ```
8. 응답에서 텍스트 추출 → markdown image URL 분리 → `{ text, imageUrls }` 반환.
9. **성공한 경우에만** `ai_chat_usage` 카운트 +1 (실패 시 한도 차감 안 함).
10. `{ assistant, usage }` 반환.

### 6.4 KST 날짜 계산

```ts
function todayKst(): string {
  const nowMs = Date.now();
  const kstMs = nowMs + 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString().slice(0, 10); // YYYY-MM-DD
}
```

## 7. Tier별 일일 한도

| `users.tier` | 명칭   | 일일 메시지 한도 |
|--------------|--------|------------------|
| 0            | free   | 1                |
| 1            | premium| 10               |
| 2            | power  | 30               |

값과 명칭은 [docs/user-tier.md](../../user-tier.md) 단일 출처를 따른다. AI 채팅은 그 표를 import만 한다(상수 중복 정의 금지).

## 8. 안전·비용 가드

| 항목 | 값 |
|------|-----|
| 입력 메시지 1건 길이 | 최대 500자 |
| 한 요청에 보내는 메시지 수 | 1~31개 (가장 큰 tier(power=30) sliding window + 신규 1). 검증은 max로 broad하게. 실제 보내는 양은 클라가 자기 tier에 맞게 cap. |
| OpenAI `max_output_tokens` | 1000 |
| 일일 메시지 (tier별) | 1 / 10 / 30 |
| 이미지 inline 표시 | 최대 4장, https만 |
| OpenAI 원본 에러 | 사용자에게 마스킹된 메시지만 노출 |
| 비-streaming MVP | 한 번에 응답 |

## 9. i18n

신규 키는 현재 지원 중인 **10개 언어 파일 모두**에 추가한다(`ko, en, ja, zh-CN, zh-TW, es, de, fr, it, ru`). ko/en은 이번 PR에서 친구체로 정확히 작성하고, 나머지 8개 언어는 일관된 키 존재를 위해 영어값으로 동일하게 채워둔다(향후 native 검토로 친구체로 다듬는다). AI 응답 자체의 친구체는 system prompt 톤 가이드로 모든 언어에서 자동 적용된다.

키:

```
aiChat.title
aiChat.headerClear
aiChat.composerPlaceholder
aiChat.composerCounter            "{n}/500"
aiChat.send
aiChat.empty.heading
aiChat.empty.subheading
aiChat.exampleNextDestination
aiChat.exampleSafety
aiChat.examplePattern
aiChat.thinking                   "타이핑 중…" / "Thinking…"
aiChat.error.generic
aiChat.error.network
aiChat.error.invalidInput
aiChat.error.rateLimited.free
aiChat.error.rateLimited.premium
aiChat.error.rateLimited.power
aiChat.error.imageLoadFailed
aiChat.confirmClear.title
aiChat.confirmClear.body
aiChat.confirmClear.confirm
aiChat.confirmClear.cancel
```

AI 응답 자체는 system prompt에 사용자 앱 언어를 명시해 모델이 그 언어로 답하게 한다.

## 10. 에지케이스

| 상황 | 동작 |
| --- | --- |
| 비로그인 상태에서 AI 탭 진입 | 기존 RootNavigator 가드가 로그인 화면으로 보냄 — 화면 자체는 로그인 가정 |
| 네트워크 오프라인 | 사용자 메시지 추가 후 어시스턴트 자리에 `error="network"` 버블 표시 + "다시 시도" 버튼(같은 요청 재시도) |
| 응답 5초 후에도 비어있음 | 일반 timeout(20초)까지 대기. 그 사이에는 "타이핑 중…" 유지 |
| 응답 텍스트가 빈 문자열 | `aiChat.error.generic` 메시지로 대체 |
| 이미지 4장 초과 응답 | 앞 4장만 채택, 나머지 무시 |
| http(비 https) 이미지 | 무시 |
| 메시지 500자 초과 입력 시도 | 입력 단에서 잘림(`maxLength`). 전송 버튼 disabled 신호 없음 |
| `users.tier` row 미존재 | `0` (free)로 간주. 카운트는 정상 진행 |
| `users` 행 자체 미존재 | 기존 시스템과 동일하게 `0`으로 fallback |
| 동시 요청(연타 전송) | composer가 전송 중에는 입력·전송 disabled. 클라단에서 1회씩만 전송 |
| 라이트/다크 테마 | 모든 컴포넌트가 `useTheme()`로 색을 받음 |
| 로그아웃 → 다른 계정 로그인 | `aiChatStore`가 `userId` 변경을 감지해 메모리 reload (다른 키) |

## 11. 키/시크릿 운영 (사용자 작업)

> ⚠️ 코드는 키 없이도 모두 빌드·배포 가능. 키 등록은 사용자 책임.

1. **OpenAI API key 발급**
   - https://platform.openai.com → API keys → Create new secret key
   - 한 번만 표시되므로 안전한 곳에 보관
   - 권장: 콘솔에서 월별 hard limit($20 등) 설정
2. **Supabase secret 등록** (둘 중 택1)
   - Dashboard: Project Settings → Edge Functions → Secrets → Add: name `OPENAI_API_KEY`, value `sk-...`
   - CLI: `supabase secrets set OPENAI_API_KEY=sk-...`
3. **Edge Function 배포**
   - `supabase functions deploy ai-chat`
4. **테이블 마이그레이션 적용**
   - SQL: `ai_chat_usage` 테이블 + RLS 정책

배포 체크리스트(`docs/배포-체크리스트.md`)에 항목 추가:
- "OPENAI_API_KEY 등록 여부 확인"
- "ai-chat Edge Function 배포 여부"

## 12. 분석 추적

이번 범위 **밖**. 코드베이스에 일반 `logEvent` 헬퍼가 아직 없고(`@react-native-firebase/analytics`는 의존성에만 존재) 단일 기능을 위해 헬퍼를 새로 만드는 것은 YAGNI 위배. analytics 헬퍼가 도입되는 시점에 다음 이벤트를 추가한다: `ai_chat_open`, `ai_chat_send`, `ai_chat_response_ok`, `ai_chat_response_error(errorKind)`, `ai_chat_rate_limited(tier)`, `ai_chat_clear`, `ai_chat_image_open`.

## 13. 향후(v2)

- 스트리밍 응답 (RN SSE 안정화)
- 사용자 자기 사진을 입력으로 보내 분석시키는 vision multimodal 입력
- 대화 멀티 thread (현재는 단일 thread)
- Tool 확장: 항공편 가격 조회, 환율, 비자 정보 API
- 사용자가 모델 선택 (mini/full)
- 한도 초과 시 광고 시청 → 1회 추가 같은 보상형 한도 (선택)

## 14. 작업 분리 (구현 단계 입력)

1. **DB 마이그레이션** — `ai_chat_usage` 테이블 + RLS 정책 SQL 작성·적용
2. **`docs/user-tier.md`** — tier 0/1/2 정책 단일 출처 문서 (이번 PR에 포함)
3. **타입·스토리지·스토어**
   - `src/features/aiChat/types.ts`
   - `src/features/aiChat/aiChatStorage.ts` (load/save/clear by userId)
   - `src/features/aiChat/aiChatStore.ts` (Zustand)
4. **클라이언트 어댑터**
   - `src/features/aiChat/aiChatClient.ts` (Edge Function 호출, 응답 정규화, 이미지 추출)
   - 마크다운 이미지 추출 함수는 `parseAssistantText.ts`로 분리하고 단위 테스트
5. **UI 컴포넌트**
   - `src/components/AiChat/AiChatBubble.tsx`
   - `src/components/AiChat/AiChatList.tsx`
   - `src/components/AiChat/AiChatComposer.tsx`
   - `src/components/AiChat/AiChatEmptyState.tsx`
   - `src/components/AiChat/UsageLimitBanner.tsx`
6. **`src/screens/AiScreen.tsx`** 교체 (기존 placeholder 제거)
7. **i18n 키 추가** ko/en
8. **Edge Function**
   - `supabase/functions/ai-chat/index.ts`
   - 단위 테스트 어려움 → integration용 README 추가
9. **로그아웃 시 메모리 정리** — `authStore.signOut`에 `aiChatStorage.clear` 호출 추가
10. **분석 이벤트 연결**
11. **배포 체크리스트 업데이트**
12. **수동 검증** — 로그인/로그아웃, 빈 상태, 한도 초과, 이미지 응답, 네트워크 오프라인, 다크모드
