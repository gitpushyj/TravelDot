# 국기 퀴즈 게임 설계

작성일: 2026-05-15

## 배경 & 목표

여행 앱 VisitGrid에 가벼운 게임 요소를 추가한다. 첫 게임은 "국기 보고 국가 맞추기"
4지선다 퀴즈다. 이 게임은 향후 만들 **게임 허브**의 첫 항목이며, 점수는 향후
**커뮤니티 탭의 리더보드/점수 자랑** 기능으로 이어진다.

핵심 제약:
- "아주 간단한 게임" — 메커니즘을 과하게 키우지 않는다.
- 하단 탭은 건드리지 않는다. 현재 4개(홈/전체국가/AI/설정)이고 커뮤니티 탭이
  추가될 예정이라, 게임은 탭과 동급의 목적지가 아니다.
- 사용자에게 노출되는 모든 텍스트는 10개 locale 전부에 번역한다.

## 내비게이션 & 화면 구조

진입점: `MainScreen` 상단 앱바(현재 "PixelTravel" 타이틀만 존재) 우측에 `Gamepad2`
(lucide) 아이콘 버튼을 추가한다. 탭은 변경하지 않는다.

`RootNavigator`에 스택 화면 2개를 추가한다:

1. **`GamesHub`** — 게임 목록 화면. 현재는 "국기 퀴즈" 카드 1개. 게임이 늘어나면
   카드만 추가한다.
2. **`FlagQuiz`** — 게임 본체. 한 화면 안에서 3가지 상태를 가진다:
   - **시작 대기(QuizStartView)**: "시작" 버튼 + 내 최고 점수(로그인 시) 또는
     "로그인하면 기록이 저장됩니다" 안내(비로그인 시)
   - **플레이 중**: 국기 + 4지선다 + 목숨(♥♥) + 현재 점수 + 10초 타이머 바
   - **게임 오버(GameOverView)**: 최종 점수 + 최고 기록 갱신 여부 + "다시하기" /
     "나가기"

게임 오버를 별도 화면이 아닌 `FlagQuiz` 내부 상태로 두는 이유: 라운드 재시작이
잦아 화면 전환 없이 상태만 바꾸는 편이 가볍고 자연스럽다.

흐름: `홈 상단바 [Gamepad2] → GamesHub → FlagQuiz (대기→플레이→게임오버→다시 플레이…)`

상단 앱바는 아래로 스크롤 시 사라지는 동작을 유지한다. 게임은 서브 기능이므로
"항상 보이지는 않지만 스크롤 업 한 번으로 닿는" 상단바 계층이 적절하다.

## 게임 메커니즘

### 한 문제 흐름

- 국기 1개 표시 → 그 아래 국가 이름 4개(정답 1 + 오답 3) → 10초 카운트다운 바.
- 정답 클릭: 초록 피드백 + 햅틱 → 다음 문제.
- 오답 클릭: 빨강 피드백 + 정답도 함께 표시 → 목숨 1 차감 → 다음 문제.
- 10초 초과: 오답과 동일 처리(정답 표시 + 목숨 차감).
- 답 선택 또는 시간 초과 후 약 1초간 정답/오답을 보여준 뒤 자동으로 다음 문제로
  넘어간다.

### 목숨 / 종료

- 목숨 2개로 시작(♥♥). 0이 되면 게임 오버.
- 문제 수 제한 없음 — 무한이며 목숨으로만 끝난다.

### 점수

점수 = 맞춘 문제 수. 난이도 progression 자체가 "오래 버틸수록 어려워진다"는
도전 요소를 제공하므로 가중치 없는 단순 정답 수로 충분하다. 시간이 지나도
리더보드 비교가 안정적이다.

### 타이머

`react-native-reanimated`로 10초 동안 너비가 줄어드는 바 애니메이션. 문제마다
리셋한다.

## 난이도 티어 & 문제 생성

### 4단계 티어 분류

기존 `src/utils/countryPopularity.ts`의 관광객 도착수 기반 인기 순위
(`popularityRank`, 106개국 랭크 + 나머지 fallback)를 티어 기준으로 재활용한다.
대상은 UN 회원국 193개국(`src/utils/unMembers.ts`의 `isUnMember`로 필터링).

| 티어 | 기준 | 대략 개수 | 성격 |
|---|---|---|---|
| 1 (쉬움) | popularityRank 1~25 | ~25 | 누구나 아는 나라 |
| 2 | rank 26~60 | ~35 | 웬만큼 알려진 나라 |
| 3 | rank 61~106 | ~46 | 들어는 봤지만 헷갈리는 나라 |
| 4 (어려움) | 랭크 없음(UN 회원국 중) | ~87 | 잘 모르는 나라 |

빌드 타임 스크립트 `scripts/generateFlagQuizTiers.mjs`로 193개국을 티어별로
분류한 `assets/data/flagQuizTiers.json`을 생성한다. 런타임은 이 JSON만 읽는다.
경계 숫자(25 / 60 / 106)는 스크립트 내 상수로 두어 튜닝 가능하게 한다.

### 게임 내 진행 — 푼 문제 수 기준 밴드

정답률이 아니라 "푼 문제 수"로 티어가 올라간다(난이도 곡선이 예측 가능):

- 1~6문제 → 티어 1
- 7~15문제 → 티어 2
- 16~27문제 → 티어 3
- 28문제~ → 티어 4

각 티어 안에서는 랜덤 비복원 추출 — 한 게임 안에서 같은 국기는 다시 나오지 않고,
매 게임 순서가 다르다. 밴드 경계 숫자도 상수로 둔다.

### 오답 3개 생성

기존 `src/features/badges/data/flagColors.json`(215개국 국기 색상 배열, 예:
`["red","yellow","blue"]`)을 재활용한다. 오답 선택 알고리즘:

1. 정답 국가의 색상 집합과 **Jaccard 유사도가 높은** 국가를 우선 후보로 둔다
   (색이 비슷 = 헷갈림).
2. 같은 티어를 우선하고, 후보가 부족하면 인접 티어에서 보충한다.
3. 최종 3개를 뽑아 정답과 섞어 4지선다를 구성한다.

## DB 스키마

Supabase 마이그레이션 1개를 추가한다. 기존 `ai_chat_usage` 마이그레이션의
테이블 + RLS 패턴을 따른다. 게임 기록 히스토리는 저장하지 않으며, 사용자당
정확히 1행만 유지한다.

```sql
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
```

- `user_id`를 PK로 두어 사용자당 1행을 강제한다.
- 게임 오버 시 단일 upsert로 처리한다. `on conflict (user_id) do update`에서
  `last_score`는 항상 갱신하고, `best_score`는 `greatest(기존 best, 이번 점수)`로
  갱신한다 — 한 쿼리로 "최고 갱신" 로직까지 원자적으로 처리하며 읽고-쓰기 경쟁이
  없다.
- RLS: 본인 행만 select / insert / update.
- PK만으로 조회가 충분하므로 별도 인덱스는 만들지 않는다.
- 리더보드용 "전체 read 정책"은 커뮤니티 기능을 만들 때 별도 마이그레이션으로
  다룬다. 이번 범위에서는 본인 행만 접근 가능하다.

## 오프라인 / 비로그인 동작

- 게임은 로그인·네트워크 없이도 완전히 플레이 가능하다.
- 점수는 **Supabase에만** 저장한다. 로컬 캐시(AsyncStorage)는 두지 않는다 —
  점수의 존재 이유가 결국 계정 기반 리더보드이므로 로컬 저장은 군더더기다.
- **로그인 상태**: 게임 오버 시 점수를 upsert하고, 그 응답값(best/last)을 그대로
  게임 오버 화면에 표시한다. 대기 화면의 최고 점수는 진입 시 네트워크 fetch로
  가져오며, fetch 동안 잠깐 로딩 상태를 보인다.
- **비로그인 / 오프라인**: 게임은 그대로 플레이 가능하지만 점수는 저장되지 않는다.
  대기 화면에는 최고 점수 줄 대신 "로그인하면 기록이 저장됩니다" 안내를 표시한다.
  upsert 실패는 게임 흐름에 영향을 주지 않으며 조용히 무시한다(이는 silent
  failure가 아니라 "오프라인 플레이"라는 정상 시나리오다).

## 파일 구조

CLAUDE.md의 "책임 단위로 파일 분리" 원칙을 따른다.

`src/features/flagQuiz/`:
- `FlagQuizScreen.tsx` — 화면 컨테이너 (대기/플레이/게임오버 상태 분기)
- `useFlagQuizGame.ts` — 게임 상태 머신 훅 (목숨/점수/현재 문제/티어 진행)
- `quizGenerator.ts` — 다음 문제 생성 (티어 추출 + 오답 생성 조합)
- `distractors.ts` — 색상 Jaccard 유사도 기반 오답 선택 알고리즘
- `tiers.ts` — 티어 JSON 로드 + 푼 문제 수 → 티어 밴드 매핑
- `scoreService.ts` — Supabase 점수 fetch + upsert
- `components/`:
  - `QuizStartView.tsx` — 시작 대기 화면
  - `FlagCard.tsx` — 국기 표시 (country-flag-icons SVG)
  - `ChoiceButton.tsx` — 4지선다 버튼 1개
  - `TimerBar.tsx` — 10초 카운트다운 바
  - `LivesIndicator.tsx` — 목숨 표시
  - `GameOverView.tsx` — 게임 오버 화면

`src/screens/GamesHub/`:
- `GamesHubScreen.tsx` — 게임 허브 화면
- `GameCard.tsx` — 허브의 게임 카드 1개

`src/navigation/screens/`:
- `GamesHubScreenNav.tsx`, `FlagQuizScreenNav.tsx` — 내비게이션 래퍼

스크립트:
- `scripts/generateFlagQuizTiers.mjs` — 티어 분류 JSON 생성

수정 대상 기존 파일:
- `src/navigation/RootNavigator.tsx` — 스택 화면 2개 등록
- `src/navigation/types.ts` — `RootStackParamList`에 라우트 2개 추가
- `src/screens/MainScreen/index.tsx`, `styles.ts` — 상단 앱바에 `Gamepad2` 진입 버튼
- `package.json` — `country-flag-icons` 의존성 추가
- `supabase/migrations/` — 마이그레이션 1개 추가
- `src/i18n/locales/*.json` — 신규 UI 텍스트 키 (10개 locale 전부)

## 국기 렌더링

`country-flag-icons`(SVG) 패키지를 추가하고, 이미 의존성으로 있는
`react-native-svg`로 렌더링한다. iOS/Android 일관되게 선명한 국기를 보장한다.
`flagEmoji()`는 stock Android에서 regional indicator 이모지를 글리프로 그리지 않고
2글자 코드로 표시하는 경우가 있어 국기가 문제 그 자체인 퀴즈에는 부적합하다.

## i18n

UI 텍스트(시작, 점수, 목숨, 게임 오버, 다시하기, 나가기, 로그인 안내, 게임 허브
제목/카드 등) 신규 키를 10개 locale(`de en es fr it ja ko ru zh-CN zh-TW`) 전부에
추가한다. 번역은 직역이 아니라 각 언어 화자에게 자연스럽게 의역한다.

국가 이름은 기존 `src/lib/countryName.ts`의 `getCountryName(code, locale)`를
사용한다 — 이미 10개 언어를 지원한다.

## 테스트

- `distractors.ts` — 색상 유사도 오답 선택이 정답을 포함하지 않고, 항상 3개를
  반환하며, 후보 부족 시 인접 티어로 보충되는지 단위 테스트.
- `tiers.ts` — 푼 문제 수 → 티어 밴드 매핑 경계값 단위 테스트.
- `quizGenerator.ts` — 한 게임 내 비복원 추출(같은 국기 재출현 없음) 검증.
- `scoreService.ts` — upsert의 best_score `greatest` 로직 검증(가능하면 통합
  테스트, 어려우면 SQL 레벨로 확인).

## 범위 밖 (이번 작업 아님)

- 커뮤니티 탭, 리더보드, 점수 자랑 UI — `flag_quiz_scores`의 전체 read 정책 포함.
- 국기 퀴즈 외 다른 게임.
- 난이도/밴드 숫자의 정교한 밸런싱 — 상수로 노출만 해두고 추후 튜닝.
