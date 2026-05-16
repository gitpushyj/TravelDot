# Games Hub 화면 리디자인

작성일: 2026-05-16

## 목적

게임 리스트 화면([GamesHubScreen](src/screens/GamesHub/GamesHubScreen.tsx))을 새 디자인 시안에 맞춰 리뉴얼한다. 현재는 Lucide 아이콘 기반 미니멀 카드 2개가 노출되지만, 본 작업 이후에는 인트로 헤더(타이틀 + 트로피 일러스트)와 컬러 테마별 게임 카드(일러스트, 배지, 통계 3칸, CTA 버튼)로 바뀐다.

데이터는 모두 **기존에 존재하는** Supabase RPC와 scoreService 함수를 활용하므로 새 마이그레이션·테이블·API는 없다.

## 범위

### In Scope

1. 게임 리스트 화면 UI 재구성 — 인트로 헤더 추가, 카드 재설계, 푸터 카드 제거
2. 카드에 **이번 주 1등 점수**, **나의 최고 점수**, **문제 수** 3칸 통계 추가
3. 화면 mount + focus 복귀 시 RPC 호출로 점수 데이터 로딩
4. 이미지 자산 3장(`game_tropi.png`, `game_earth.png`, `game_passport.png`)을 `assets/`에 복사
5. i18n 키 추가/정리 — 10개 locale 모두 동시 반영
6. CLAUDE.md 룰 5(파일 분할)에 따른 sub-component 분리

### Out of Scope

- 누적/역대 leaderboard 기능 (이번 주 RPC만 사용)
- 캐싱/Zustand store 도입 (필요해지면 후속 작업)
- 게임 플레이 화면([FlagQuizScreen.tsx](src/features/flagQuiz/FlagQuizScreen.tsx), [TravelTriviaScreen.tsx](src/features/travelTrivia/TravelTriviaScreen.tsx)) 내부 변경
- 이미지 최적화 (현재 PNG 약 0.8~2.1MB; 후속 작업으로 유지)
- 새 게임 추가

## 화면 구조

### 1. 헤더 영역 (기존 유지)

- `← 게임` 텍스트와 뒤로가기 Pressable. 현재 GamesHubScreen 라인 22-37 그대로.

### 2. 인트로 헤더 (NEW · 별도 컴포넌트)

- 컴포넌트: `src/screens/GamesHub/GamesHubIntro.tsx`
- 좌측 컬럼:
  - 타이틀(2줄): "여행도 지식도 / **게임**으로 즐겨보세요!" — "게임" 단어는 오렌지 액센트 컬러(`theme.accent` 또는 신규 토큰)로 강조
  - 부제(1줄, secondary text): "퀴즈를 풀고 세계 여행 마스터가 되어보세요."
- 우측 컬럼:
  - `<Image source={require('../../../assets/game_tropi.png')} />` — 정사각형 가까운 비율, `width: 140, height: 140`, `resizeMode: 'contain'`
- 레이아웃: `flexDirection: 'row'`, 텍스트는 `flex: 1`, 이미지는 고정 폭. 외부 좌우 패딩 16.

### 3. 게임 카드 2장 (NEW · 재설계)

각 카드는 하나의 `<GameCard>` 컴포넌트가 컬러 테마와 콘텐츠를 prop으로 받아 렌더링한다.

#### 카드 공통 구조

```
┌─[round 24, 카드 배경: 컬러 테마 연한 톤]──────┐
│ ┌────┐  ┌─[배지: 진한 톤 알약]────┐          │
│ │일러 │  │  🏁  국기 퀴즈           │          │
│ │스트 │  └────────────────────┘          │
│ │    │  국기를 보고                       │
│ │    │  나라를 맞혀보세요!                 │
│ └────┘                                  │
│ ─────────────────────────────────       │
│ ⭐ 1등 점수   📊 나의 최고   ☰ 문제 수      │
│   2,460       1,250        50           │
│ ─────────────────────────────────       │
│         ┌──[큰 컬러 버튼]──┐               │
│         │ 플레이하기  >    │               │
│         └────────────────┘               │
└────────────────────────────────────┘
```

- 좌측 일러스트: `width: 96, height: 96`, `resizeMode: 'contain'`, 카드 패딩 안에 배치
- 일러스트와 텍스트 영역은 `flexDirection: 'row'`, 텍스트 영역은 `flex: 1`
- 배지: 작은 알약(`paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999`), 아이콘(Lucide `Flag`/`Globe2`, 색상은 흰색) + 짧은 라벨, 배경은 카드 진한 액센트 컬러
- 카드 타이틀: 2줄, `fontSize: 22, fontWeight: '800'`, 진한 텍스트
- 통계 분리선: 위·아래에 얇은 separator (`height: StyleSheet.hairlineWidth`, 색상은 카드 톤보다 진한 무채색 또는 액센트의 alpha 20%)
- 통계 행: 3칸 `flex: 1`, 각 칸에 작은 아이콘 + 라벨(작은 글씨, secondary) + 큰 숫자(`fontSize: 20, fontWeight: '700'`)
- 통계 아이콘 후보:
  - 1등 점수: `Star` (lucide)
  - 나의 최고: `BarChart3` 또는 `TrendingUp` (lucide)
  - 문제 수: `ListChecks` 또는 `List` (lucide)
- CTA 버튼: 카드 진한 액센트 컬러 배경, 흰색 글씨, `paddingVertical: 14, borderRadius: 16`, 가로폭은 카드 폭에서 좌측 일러스트 영역 제외하고 우측 콘텐츠 영역과 동일. 우측에 `ChevronRight` 아이콘.

#### 국기 퀴즈 카드 (오렌지 테마)

- 일러스트: `game_earth.png` (지구본+깃발)
- 배경: 오렌지 연한 톤 (예: `#FFEFE0`)
- 액센트: 오렌지 진한 톤 (예: `#FF8B5A`)
- 배지 텍스트: `t('gamesHub.flagQuizBadge')` = "국기 퀴즈"
- 카드 타이틀: `t('gamesHub.flagQuizTitle')` = "국기를 보고\n나라를 맞혀보세요!"
- 문제 수: 50
- CTA: `t('gamesHub.play')` = "플레이하기"
- 진입 화면: `onOpenFlagQuiz()` (기존 그대로)

#### 여행 상식 카드 (블루 테마)

- 일러스트: `game_passport.png` (여권+나침반)
- 배경: 블루 연한 톤 (예: `#E5EEFB`)
- 액센트: 블루 진한 톤 (예: `#3D7BE4`)
- 배지 텍스트: `t('gamesHub.triviaBadge')` = "여행 상식 퀴즈"
- 카드 타이틀: `t('gamesHub.triviaTitle')` = "전 세계 여행 상식\n100문제에 도전해 보세요!"
- 문제 수: 100
- CTA: `t('gamesHub.challenge')` = "도전하기"
- 진입 화면: `onOpenTravelTrivia()` (기존 그대로)

### 4. 제거 항목

- 시안 하단의 "기록은 경쟁의 시작!" 카드는 **현재 코드에 없으므로 추가하지 않음**. 사용자의 "제거" 지시는 디자인 시안 기준으로 해석.
- 카드 안의 "난이도 / 보통·어려움" 표시는 **현재 코드에 없음**. 디자인 시안 기준으로 추가하지 않음.
- 플레이 횟수는 **현재 코드에 없음**. 디자인 시안 기준으로 추가하지 않음.

## 데이터 모델

### 호출할 기존 함수

- [src/features/flagQuiz/scoreService.ts](src/features/flagQuiz/scoreService.ts)
  - `fetchLeaderboard(1)` → top1 `LeaderboardEntry` (bestScore 사용)
  - `fetchMyQuizScore()` → `{ bestScore, lastScore } | null`
- [src/features/travelTrivia/scoreService.ts](src/features/travelTrivia/scoreService.ts)
  - `fetchTriviaLeaderboard(1)` → top1 `LeaderboardEntry`
  - `fetchMyTriviaScore()` → `{ bestScore, lastScore } | null`

### 카드별 표시 데이터

| 칸 | 값 | 빈 값/실패 |
|---|---|---|
| 1등 점수 | `leaderboard[0]?.bestScore` | `-` |
| 나의 최고 | `myScore?.bestScore` (null이거나 0이면 빈 값으로 표시) | `-` |
| 문제 수 | 정적 50 / 100 | 항상 표시 |

### 로딩 전략

- 데이터 fetch는 `useGamesHubScores` 커스텀 훅으로 분리:
  - 파일: `src/screens/GamesHub/useGamesHubScores.ts`
  - 반환: `{ flagTop, flagMyBest, triviaTop, triviaMyBest, isLoading }`
  - 내부에서 4개 호출을 `Promise.allSettled`로 병렬 처리 (한 호출 실패해도 다른 칸은 정상)
  - `useFocusEffect`(`@react-navigation/native`)로 화면 focus 진입 시마다 재호출 — 게임을 풀고 돌아왔을 때 즉시 갱신되도록
  - 컴포넌트 unmount 시 stale setState 방지: `isMounted` ref 패턴 또는 AbortController

- 초기 렌더 시 모든 점수 칸은 `'-'`로 표시. 응답 도착하면 숫자로 채워짐. 로딩 스피너는 사용하지 않음 (UX 단순성).
- 0점은 표시 정책:
  - `myScore.bestScore === 0` (시즌 첫 진입이거나 점수 row가 없음) → `-` 로 표시
  - `leaderboard[0]?.bestScore === 0` → 사실상 발생 가능성 매우 낮지만 `-` 로 표시
- 비로그인:
  - `fetchMyQuizScore()` / `fetchMyTriviaScore()`는 RPC 응답이 null → `-` 표시
  - `fetchLeaderboard()` / `fetchTriviaLeaderboard()`는 RLS `security definer`로 공개 → 정상 표시

### 숫자 포매팅

- `Intl.NumberFormat(i18n.language).format(score)` 사용 → 한국어 `1,250`, 독일어 `1.250`, 프랑스어 `1 250` 등 자연스러운 표기.
- 0 또는 null → `'-'` (locale 무관)

## i18n 키 변경

### 추가/유지 (`gamesHub` 네임스페이스, 10개 locale 모두)

```json
"gamesHub": {
  "title": "게임",
  "introTitle": "여행도 지식도\n게임으로 즐겨보세요!",
  "introSubtitle": "퀴즈를 풀고 세계 여행 마스터가 되어보세요.",
  "flagQuizBadge": "국기 퀴즈",
  "flagQuizTitle": "국기를 보고\n나라를 맞혀보세요!",
  "triviaBadge": "여행 상식 퀴즈",
  "triviaTitle": "전 세계 여행 상식\n100문제에 도전해 보세요!",
  "topScore": "1등 점수",
  "myBestScore": "나의 최고",
  "questionCount": "문제 수",
  "play": "플레이하기",
  "challenge": "도전하기",
  "emptyScore": "-"
}
```

- 기존 `flagQuizDesc`, `triviaDesc`는 **삭제** (새 디자인이 카드 안에 큰 타이틀만 사용)
- 줄바꿈은 `\n`으로 데이터에 박지 않고 컴포넌트 단에서 `\n` 포함 문자열을 `Text`로 렌더하도록 처리 — 단, 언어별로 줄바꿈 위치가 다르므로 i18n 값 안에 `\n`을 포함해도 무방. 번역 시 각 언어 화자가 자연스러운 위치에 줄바꿈을 넣을 수 있게 가이드.

### 번역 가이드 (각 locale에서 적용)

- **직역 금지, 의역 우선** — 각 언어 화자에게 자연스러운 카피로
- "여행도 지식도 게임으로" 같은 한국어 특유의 운율은 다른 언어에서 운율을 살리지 못해도 의미가 통하게
- 숫자 표기는 `Intl.NumberFormat`이 처리하므로 i18n 값에는 숫자 포함 안 함
- 줄바꿈 `\n`은 각 언어 단어 길이에 맞는 위치에 둠 (영어는 짧으니 1줄로 가도 됨, 단 균형을 위해 두 줄 유지 권장)

## 컴포넌트 파일 구조 (CLAUDE.md 룰 5)

```
src/screens/GamesHub/
├── GamesHubScreen.tsx       ← 헤더 + Intro + 카드 2개 컴포지션 + useGamesHubScores 호출
├── GamesHubIntro.tsx        ← NEW · 인트로 헤더 (타이틀, 부제, 트로피 일러스트)
├── GameCard.tsx             ← 재작성 · 카드 1개 (배지, 일러스트, 타이틀, 통계, CTA)
├── GameCardBadge.tsx        ← NEW · 상단 알약 배지 (아이콘 + 라벨)
├── GameCardStats.tsx        ← NEW · 통계 3칸 (1등/나의 최고/문제 수)
├── GameCardCTA.tsx          ← NEW · 큰 컬러 버튼
└── useGamesHubScores.ts     ← NEW · 4개 RPC 병렬 fetch + focus 시 재호출
```

각 파일은 단일 책임만 갖고, props로만 의존성을 받는다. `GameCard.tsx`가 200줄을 넘기 시작하면 추가 분할 검토.

## 컬러 토큰

새 디자인은 두 가지 컬러 테마(오렌지/블루)를 사용한다. 현재 [themeStore](src/theme/themeStore.ts)에 단일 accent만 있다면, 카드별 컬러는 컴포넌트 내부에 명시적 객체로 보유:

```ts
const flagQuizPalette = {
  cardBg: '#FFEFE0',
  accent: '#FF8B5A',
  accentText: '#FFFFFF',
} as const;

const triviaPalette = {
  cardBg: '#E5EEFB',
  accent: '#3D7BE4',
  accentText: '#FFFFFF',
} as const;
```

다크 모드: `themeStore.isDark`(또는 동등 신호) 기준으로 카드 배경을 어두운 톤 (예: `#3A2A1F` / `#1F2A40`)으로 분기. 액센트 컬러는 동일하게 유지. 정확한 다크 톤은 구현 단계에서 themeStore 구조 확인 후 결정.

본 spec에서는 컬러값을 후보로만 명시하고, 실제 값은 구현 시 시안 PNG를 다시 보고 미세 조정한다.

## 이미지 자산

다음 3장을 worktree로 복사:

| 원본 | 대상 |
|---|---|
| `/Users/ocean.view/dev/PixelTravelResource/games/game_tropi.png` | `assets/game_tropi.png` |
| `/Users/ocean.view/dev/PixelTravelResource/games/game_earth.png` | `assets/game_earth.png` |
| `/Users/ocean.view/dev/PixelTravelResource/games/game_passport.png` | `assets/game_passport.png` |

- 기존 패턴(`assets/login_image.png`, `assets/sync_image.png` 등 직속 배치)과 일관
- 코드에서는 `require('../../../assets/game_tropi.png')` 형태로 정적 require
- 이미지 크기가 PNG 0.8~2.1MB로 다소 큼 — 본 작업 범위 외(후속 최적화 가능)

## 변경되지 않는 것 (확인용)

- `GamesHubScreen`의 props 인터페이스 (`onClose`, `onOpenFlagQuiz`, `onOpenTravelTrivia`) — 부모에서 호출하는 방식 유지
- 게임 진입 화면(FlagQuizScreen, TravelTriviaScreen) 내부 — 점수 표시/저장/리더보드 호출 로직 모두 그대로
- Supabase 마이그레이션 / RPC / 테이블 — 변경 없음
- 다른 화면의 i18n 키 — 변경 없음

## 검증 체크리스트

구현 완료 시점에 확인:

- [ ] `assets/` 에 PNG 3장이 존재 (`ls assets/game_*.png`)
- [ ] GamesHubScreen이 빌드되고 타입체크 통과 (`npx tsc --noEmit`)
- [ ] 10개 locale JSON이 모두 `JSON.parse` 가능
- [ ] 10개 locale에 `gamesHub.introTitle`·`gamesHub.topScore`·`gamesHub.myBestScore` 등 새 키 존재
- [ ] 비로그인 상태에서 화면 열어도 1등 점수는 표시되고, 나의 최고는 `-` 표시
- [ ] 게임을 풀고 화면으로 돌아오면 점수가 갱신되는지 (focus effect 동작 확인)
- [ ] 한 RPC가 실패해도 다른 칸은 정상 표시
- [ ] 라이트/다크 테마 모두에서 가독성 확인
