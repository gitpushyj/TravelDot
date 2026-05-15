# 국기 퀴즈 게임 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 여행 앱 VisitGrid에 "국기 보고 국가 맞추기" 4지선다 무한 퀴즈 게임을 추가한다.

**Architecture:** 순수 로직(티어 분류·오답 생성·문제 생성·게임 상태 머신)을 `src/features/flagQuiz/`에 파일 단위로 분리해 babel-jest 단위 테스트로 검증하고, RN 컴포넌트는 그 위에 얇게 올린다. 점수는 Supabase 단일 행(`flag_quiz_scores`)에 RPC로 원자적 upsert한다. 진입점은 홈 상단 앱바의 `Gamepad2` 아이콘 → `GamesHub` 스택 화면 → `FlagQuiz` 스택 화면.

**Tech Stack:** React Native / Expo, TypeScript, zustand(기존 store 패턴), react-navigation native-stack, react-native-svg + `country-flag-icons`(SVG 문자열), Supabase(Postgres RPC), i18next(10개 locale), jest + babel-jest.

**스펙 대비 의도적 단순화 2건 (실행자 참고):**
1. 스펙의 "빌드 타임 스크립트(`generateFlagQuizTiers.mjs`) + JSON 에셋" 대신, 티어 분류를 런타임 모듈 로드 시 1회 계산한다. 이유: `.mjs` 스크립트가 TS 모듈(`countryPopularity.ts`, `unMembers.ts`)을 import할 수 없어 데이터 중복이 생긴다. 193개 배열 룩업은 모듈 로드 시 무시할 만한 비용이라 런타임 분류가 더 단순하고 단일 소스다.
2. 스펙의 "TimerBar는 reanimated 너비 애니메이션" 대신, 훅이 소유한 단일 카운트다운(100ms interval)이 `secondsLeft`를 내려주고 TimerBar는 평범한 `View` 너비로 그린다. 이유: 타이머 권위(타임아웃 판정)와 바 애니메이션을 두 개의 타이머로 두면 드리프트가 생긴다. 단일 타이머 + 100ms 갱신이면 충분히 부드럽다.

---

## 파일 구조

생성:
- `src/features/flagQuiz/shuffle.ts` — `shuffle<T>(arr, rng)` 순수 유틸 (distractors·quizGenerator·gameMachine 공용)
- `src/features/flagQuiz/shuffle.test.ts`
- `src/features/flagQuiz/tiers.ts` — UN 193개국 4티어 분류 + 푼 문제 수 → 티어 밴드 매핑
- `src/features/flagQuiz/tiers.test.ts`
- `src/features/flagQuiz/distractors.ts` — 국기 색상 Jaccard 유사도 기반 오답 3개 선택
- `src/features/flagQuiz/distractors.test.ts`
- `src/features/flagQuiz/quizGenerator.ts` — 다음 문제(정답 + 4지선다) 생성
- `src/features/flagQuiz/quizGenerator.test.ts`
- `src/features/flagQuiz/gameMachine.ts` — 순수 게임 상태 전이 (idle/playing/over, 목숨, 점수)
- `src/features/flagQuiz/gameMachine.test.ts`
- `src/features/flagQuiz/scoreService.ts` — Supabase 점수 조회 + RPC upsert
- `src/features/flagQuiz/scoreService.test.ts`
- `src/features/flagQuiz/useFlagQuizGame.ts` — 게임 훅 (gameMachine + 10초 타이머 + reveal 오케스트레이션)
- `src/features/flagQuiz/components/FlagCard.tsx`
- `src/features/flagQuiz/components/TimerBar.tsx`
- `src/features/flagQuiz/components/LivesIndicator.tsx`
- `src/features/flagQuiz/components/ChoiceButton.tsx`
- `src/features/flagQuiz/components/QuizStartView.tsx`
- `src/features/flagQuiz/components/GameOverView.tsx`
- `src/features/flagQuiz/FlagQuizScreen.tsx` — 화면 컨테이너 (대기/플레이/게임오버 분기)
- `src/screens/GamesHub/GamesHubScreen.tsx` — 게임 허브 화면
- `src/screens/GamesHub/GameCard.tsx` — 허브의 게임 카드 1개
- `src/navigation/screens/GamesHubScreenNav.tsx`
- `src/navigation/screens/FlagQuizScreenNav.tsx`

수정:
- `package.json` — `country-flag-icons` 의존성 추가
- `supabase/migrations/20260515000000_flag_quiz_scores.sql` — 신규 마이그레이션
- `src/navigation/types.ts` — `RootStackParamList`에 `GamesHub`, `FlagQuiz` 추가
- `src/navigation/RootNavigator.tsx` — 스택 화면 2개 등록
- `src/screens/MainScreen/index.tsx` — 상단 앱바에 `Gamepad2` 진입 버튼
- `src/screens/MainScreen/styles.ts` — 진입 버튼 스타일
- `src/i18n/locales/{de,en,es,fr,it,ja,ko,ru,zh-CN,zh-TW}.json` — 신규 키

---

## Task 1: `country-flag-icons` 의존성 추가

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 패키지 설치**

Run: `npm install country-flag-icons`
Expected: `package.json`의 `dependencies`에 `country-flag-icons`가 추가되고 설치 성공.

- [ ] **Step 2: string 서브패키지 동작 확인**

Run: `node -e "const F=require('country-flag-icons/string/3x2'); console.log(typeof F.KR, F.KR.slice(0,5));"`
Expected: `string <svg ` 또는 `string <?xml` 로 시작하는 출력. (SVG 문자열이 반환됨을 확인)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(flag-quiz): country-flag-icons 의존성 추가"
```

---

## Task 2: Supabase 마이그레이션 (테이블 + RLS + RPC)

**Files:**
- Create: `supabase/migrations/20260515000000_flag_quiz_scores.sql`

- [ ] **Step 1: 마이그레이션 SQL 작성**

`supabase/migrations/20260515000000_flag_quiz_scores.sql`:

```sql
-- 국기 퀴즈 게임 점수.
-- 사용자당 정확히 1행. 게임 기록 히스토리는 저장하지 않고 역대 최고(best)와
-- 최신(last) 점수만 유지한다. 향후 커뮤니티 리더보드의 소스가 된다.
-- 본인 행만 select/insert/update 가능. 리더보드용 전체 read 정책은
-- 커뮤니티 기능 작업 때 별도 마이그레이션으로 추가한다.

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

-- 게임 종료 점수 제출. 단일 호출로 last는 항상 갱신, best는 greatest로 갱신한다.
-- security invoker(기본)로 두어 RLS 정책(본인 행)이 그대로 적용된다.
create function public.submit_flag_quiz_score(p_score integer)
  returns table (best_score integer, last_score integer)
  language sql
as $$
  insert into public.flag_quiz_scores (user_id, best_score, last_score, last_played_at, updated_at)
  values (auth.uid(), p_score, p_score, now(), now())
  on conflict (user_id) do update set
    last_score = excluded.last_score,
    best_score = greatest(public.flag_quiz_scores.best_score, excluded.last_score),
    last_played_at = excluded.last_played_at,
    updated_at = now()
  returning flag_quiz_scores.best_score, flag_quiz_scores.last_score;
$$;

grant execute on function public.submit_flag_quiz_score(integer) to authenticated;
```

- [ ] **Step 2: SQL 문법 sanity 확인**

Run: `grep -c "create policy" supabase/migrations/20260515000000_flag_quiz_scores.sql`
Expected: `3`

이 마이그레이션은 원격 Supabase에 직접 적용하지 않는다 (CLAUDE.md "No Remote Push"). 파일만 커밋하고, 적용은 사용자가 별도로 진행한다.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260515000000_flag_quiz_scores.sql
git commit -m "feat(flag-quiz): flag_quiz_scores 테이블 + 점수 제출 RPC 마이그레이션"
```

---

## Task 3: `shuffle.ts` — 순수 셔플 유틸

**Files:**
- Create: `src/features/flagQuiz/shuffle.ts`
- Test: `src/features/flagQuiz/shuffle.test.ts`

- [ ] **Step 1: Write the failing test**

`src/features/flagQuiz/shuffle.test.ts`:

```ts
import { shuffle } from "./shuffle";

// 결정적 rng: 주어진 시퀀스를 순환하며 반환한다.
function seqRng(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("shuffle", () => {
  it("원본 배열을 변형하지 않고 새 배열을 반환한다", () => {
    const input = [1, 2, 3, 4];
    const out = shuffle(input, seqRng([0, 0, 0]));
    expect(out).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4]);
  });

  it("같은 원소 집합을 유지한다", () => {
    const out = shuffle(["a", "b", "c", "d"], seqRng([0.5, 0.1, 0.9]));
    expect([...out].sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("rng=0이면 Fisher-Yates에서 첫 원소가 끝으로 회전한다", () => {
    // j = floor(rng * (i+1)) = 0 매번 → 각 i에서 arr[i]와 arr[0] 교환
    const out = shuffle([1, 2, 3], () => 0);
    expect(out).toEqual([2, 3, 1]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/flagQuiz/shuffle.test.ts`
Expected: FAIL — `Cannot find module './shuffle'`

- [ ] **Step 3: Write minimal implementation**

`src/features/flagQuiz/shuffle.ts`:

```ts
// Fisher-Yates 셔플. 원본을 변형하지 않고 새 배열을 반환한다.
// rng는 [0,1) 범위 함수 (테스트에서 결정적 주입을 위해 파라미터화).
export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/flagQuiz/shuffle.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/flagQuiz/shuffle.ts src/features/flagQuiz/shuffle.test.ts
git commit -m "feat(flag-quiz): Fisher-Yates 셔플 유틸"
```

---

## Task 4: `tiers.ts` — 4티어 분류 + 진행 밴드

**Files:**
- Create: `src/features/flagQuiz/tiers.ts`
- Test: `src/features/flagQuiz/tiers.test.ts`

배경: `src/utils/countryPopularity.ts`의 `popularityRank(code)`는 관광객 도착수 기반 순위(1~106), 미등재국은 107(fallback)을 반환한다. `src/utils/unMembers.ts`의 `isUnMember(code)`로 UN 193개국을 필터링한다. `assets/data/countries.json`은 `{ code, name, nameKo }[]` 215개 항목.

- [ ] **Step 1: Write the failing test**

`src/features/flagQuiz/tiers.test.ts`:

```ts
import { TIER_COUNTRIES, ALL_TIERS, tierForQuestionIndex } from "./tiers";

describe("TIER_COUNTRIES", () => {
  it("4개 티어로 UN 193개국을 빠짐없이 나눈다", () => {
    const total = ALL_TIERS.reduce((n, t) => n + TIER_COUNTRIES[t].length, 0);
    expect(total).toBe(193);
  });

  it("티어 간 중복이 없다", () => {
    const all = ALL_TIERS.flatMap((t) => TIER_COUNTRIES[t]);
    expect(new Set(all).size).toBe(193);
  });

  it("잘 알려진 나라는 티어 1, 인기 순위 미등재국은 티어 4", () => {
    expect(TIER_COUNTRIES[1]).toContain("FR"); // popularityRank 1
    expect(TIER_COUNTRIES[1]).toContain("US");
    // 투발루(TV)는 popularityRank 미등재 → 티어 4
    expect(TIER_COUNTRIES[4]).toContain("TV");
  });
});

describe("tierForQuestionIndex", () => {
  it("푼 문제 수에 따라 밴드별 티어를 반환한다", () => {
    // 1~6 → T1, 7~15 → T2, 16~27 → T3, 28~ → T4 (answeredCount는 0-based)
    expect(tierForQuestionIndex(0)).toBe(1); // 1번째 문제
    expect(tierForQuestionIndex(5)).toBe(1); // 6번째
    expect(tierForQuestionIndex(6)).toBe(2); // 7번째
    expect(tierForQuestionIndex(14)).toBe(2); // 15번째
    expect(tierForQuestionIndex(15)).toBe(3); // 16번째
    expect(tierForQuestionIndex(26)).toBe(3); // 27번째
    expect(tierForQuestionIndex(27)).toBe(4); // 28번째
    expect(tierForQuestionIndex(200)).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/flagQuiz/tiers.test.ts`
Expected: FAIL — `Cannot find module './tiers'`

- [ ] **Step 3: Write minimal implementation**

`src/features/flagQuiz/tiers.ts`:

```ts
import countriesJson from "../../../assets/data/countries.json";
import { popularityRank } from "../../utils/countryPopularity";
import { isUnMember } from "../../utils/unMembers";

export type Tier = 1 | 2 | 3 | 4;
export const ALL_TIERS: Tier[] = [1, 2, 3, 4];

type CountryEntry = { code: string; name: string; nameKo: string };

// 티어 경계 (popularityRank 기준). 튜닝 지점.
//   T1: rank 1~25, T2: 26~60, T3: 61~106, T4: 107(미등재)
const TIER_RANK_MAX: Record<Tier, number> = { 1: 25, 2: 60, 3: 106, 4: Infinity };

function classifyTier(code: string): Tier {
  const rank = popularityRank(code);
  if (rank <= TIER_RANK_MAX[1]) return 1;
  if (rank <= TIER_RANK_MAX[2]) return 2;
  if (rank <= TIER_RANK_MAX[3]) return 3;
  return 4;
}

// 모듈 로드 시 1회 계산: UN 193개국을 4티어로 분류한다.
export const TIER_COUNTRIES: Record<Tier, string[]> = (() => {
  const buckets: Record<Tier, string[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const entry of countriesJson as CountryEntry[]) {
    if (!isUnMember(entry.code)) continue;
    buckets[classifyTier(entry.code)].push(entry.code);
  }
  return buckets;
})();

// 게임 내 진행: 푼 문제 수(0-based answeredCount) → 현재 티어.
//   문제 1~6 → T1, 7~15 → T2, 16~27 → T3, 28~ → T4
const TIER_BAND_END: { end: number; tier: Tier }[] = [
  { end: 6, tier: 1 },
  { end: 15, tier: 2 },
  { end: 27, tier: 3 },
];

export function tierForQuestionIndex(answeredCount: number): Tier {
  const questionNumber = answeredCount + 1; // 1-based
  for (const band of TIER_BAND_END) {
    if (questionNumber <= band.end) return band.tier;
  }
  return 4;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/flagQuiz/tiers.test.ts`
Expected: PASS (5 tests)

만약 "4개 티어로 UN 193개국" 테스트가 193이 아닌 값으로 실패하면: `countries.json`에 일부 UN 코드가 누락되었거나 추가 코드가 있는 것이다. `node -e "const c=require('./assets/data/countries.json'); const {isUnMember}=...; console.log(c.filter(x=>isUnMember(x.code)).length)"` 로 실제 개수를 확인하고, 테스트의 기대값을 실제 UN 멤버 교집합 수로 맞춘다 (193 이하일 수 있음).

- [ ] **Step 5: Commit**

```bash
git add src/features/flagQuiz/tiers.ts src/features/flagQuiz/tiers.test.ts
git commit -m "feat(flag-quiz): UN 193개국 4티어 분류 + 진행 밴드"
```

---

## Task 5: `distractors.ts` — 색상 유사도 오답 선택

**Files:**
- Create: `src/features/flagQuiz/distractors.ts`
- Test: `src/features/flagQuiz/distractors.test.ts`

배경: `src/features/badges/data`의 `FLAG_COLORS_BY_CODE`는 `Record<string, FlagColor[]>` (예: `KR: ["red","blue","white","black"]`).

- [ ] **Step 1: Write the failing test**

`src/features/flagQuiz/distractors.test.ts`:

```ts
jest.mock("../badges/data", () => ({
  FLAG_COLORS_BY_CODE: {
    AA: ["red", "white"],
    BB: ["red", "white"], // AA와 동일 → 유사도 1
    CC: ["red", "white", "blue"], // AA와 높은 유사도
    DD: ["green", "yellow"], // AA와 유사도 0
    EE: ["green", "yellow", "black"], // AA와 유사도 0
    FF: ["green", "black"], // AA와 유사도 0
  },
}));

import { colorSimilarity, pickDistractors } from "./distractors";

function seqRng(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("colorSimilarity", () => {
  it("동일 색 집합은 1", () => {
    expect(colorSimilarity("AA", "BB")).toBe(1);
  });
  it("공통 색이 없으면 0", () => {
    expect(colorSimilarity("AA", "DD")).toBe(0);
  });
  it("부분 겹침은 0과 1 사이 (교집합/합집합)", () => {
    // AA{red,white} vs CC{red,white,blue} → 2/3
    expect(colorSimilarity("AA", "CC")).toBeCloseTo(2 / 3);
  });
});

describe("pickDistractors", () => {
  it("정답을 제외한 서로 다른 3개를 반환한다", () => {
    const out = pickDistractors("AA", ["AA", "BB", "CC", "DD", "EE", "FF"], [], seqRng([0, 0, 0]));
    expect(out).toHaveLength(3);
    expect(out).not.toContain("AA");
    expect(new Set(out).size).toBe(3);
  });

  it("같은 티어 후보가 3개 미만이면 fallback 풀에서 보충한다", () => {
    const out = pickDistractors("AA", ["AA", "BB"], ["DD", "EE", "FF"], seqRng([0, 0, 0]));
    expect(out).toHaveLength(3);
    expect(out).not.toContain("AA");
    expect(out).toContain("BB");
  });

  it("색상이 유사한 나라를 우선 후보로 둔다", () => {
    // 유사 후보(BB,CC)가 비유사(DD,EE,FF)보다 먼저 채워진다.
    // rng=0이면 셔플 후 confusing set의 앞쪽이 선택됨.
    const out = pickDistractors("AA", ["AA", "BB", "CC", "DD", "EE", "FF"], [], () => 0);
    expect(out).toContain("BB");
    expect(out).toContain("CC");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/flagQuiz/distractors.test.ts`
Expected: FAIL — `Cannot find module './distractors'`

- [ ] **Step 3: Write minimal implementation**

`src/features/flagQuiz/distractors.ts`:

```ts
import { FLAG_COLORS_BY_CODE } from "../badges/data";
import { shuffle } from "./shuffle";

// 헷갈리는 오답 후보로 우선 고려할 "색상 유사 상위" 개수.
const CONFUSING_TOP_K = 8;
const DISTRACTOR_COUNT = 3;

// 두 국가 국기 색상 집합의 Jaccard 유사도 (교집합 / 합집합). 0~1.
export function colorSimilarity(a: string, b: string): number {
  const ca = FLAG_COLORS_BY_CODE[a] ?? [];
  const cb = FLAG_COLORS_BY_CODE[b] ?? [];
  if (ca.length === 0 && cb.length === 0) return 0;
  const setA = new Set(ca);
  const setB = new Set(cb);
  let inter = 0;
  for (const c of setA) if (setB.has(c)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

// 정답을 제외한, 색상이 헷갈리는 오답 3개를 고른다.
// tierPool: 같은 티어 코드들(정답 포함 가능). fallbackPool: 인접 티어 보충용.
export function pickDistractors(
  answer: string,
  tierPool: readonly string[],
  fallbackPool: readonly string[],
  rng: () => number = Math.random,
): string[] {
  let candidates = tierPool.filter((c) => c !== answer);
  if (candidates.length < DISTRACTOR_COUNT) {
    const extra = fallbackPool.filter((c) => c !== answer && !candidates.includes(c));
    candidates = candidates.concat(extra);
  }
  // 색상 유사도 내림차순 정렬 후 상위 K개를 "헷갈리는 후보"로.
  const ranked = candidates
    .slice()
    .sort((a, b) => colorSimilarity(answer, b) - colorSimilarity(answer, a));
  const confusing = ranked.slice(0, Math.max(CONFUSING_TOP_K, DISTRACTOR_COUNT));
  return shuffle(confusing, rng).slice(0, DISTRACTOR_COUNT);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/flagQuiz/distractors.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/flagQuiz/distractors.ts src/features/flagQuiz/distractors.test.ts
git commit -m "feat(flag-quiz): 국기 색상 유사도 기반 오답 선택"
```

---

## Task 6: `quizGenerator.ts` — 다음 문제 생성

**Files:**
- Create: `src/features/flagQuiz/quizGenerator.ts`
- Test: `src/features/flagQuiz/quizGenerator.test.ts`

- [ ] **Step 1: Write the failing test**

`src/features/flagQuiz/quizGenerator.test.ts`:

```ts
import { generateQuestion } from "./quizGenerator";
import { TIER_COUNTRIES } from "./tiers";

function seqRng(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("generateQuestion", () => {
  it("정답을 포함한 서로 다른 4개 선택지를 만든다", () => {
    const q = generateQuestion(0, new Set(), seqRng([0.1, 0.2, 0.3, 0.4, 0.5]));
    expect(q.choices).toHaveLength(4);
    expect(q.choices).toContain(q.answerCode);
    expect(new Set(q.choices).size).toBe(4);
  });

  it("answeredCount 0이면 티어 1 국가가 정답이다", () => {
    const q = generateQuestion(0, new Set(), seqRng([0, 0, 0, 0, 0]));
    expect(TIER_COUNTRIES[1]).toContain(q.answerCode);
  });

  it("이미 사용한 코드는 정답으로 다시 내지 않는다", () => {
    const used = new Set(TIER_COUNTRIES[1].slice(0, TIER_COUNTRIES[1].length - 1));
    // 티어 1에서 1개만 남김 → 그 1개가 정답이어야 함
    const remaining = TIER_COUNTRIES[1][TIER_COUNTRIES[1].length - 1];
    const q = generateQuestion(0, used, seqRng([0, 0, 0, 0]));
    expect(q.answerCode).toBe(remaining);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/flagQuiz/quizGenerator.test.ts`
Expected: FAIL — `Cannot find module './quizGenerator'`

- [ ] **Step 3: Write minimal implementation**

`src/features/flagQuiz/quizGenerator.ts`:

```ts
import { pickDistractors } from "./distractors";
import { shuffle } from "./shuffle";
import { TIER_COUNTRIES, tierForQuestionIndex, type Tier } from "./tiers";

export type QuizQuestion = {
  // 정답 국가 ISO alpha-2 코드.
  answerCode: string;
  // 4지선다 코드 (정답 포함, 셔플됨).
  choices: string[];
};

// 인접 티어 풀: 보충용. 현재 티어보다 한 단계 위/아래를 합친다.
function adjacentPool(tier: Tier): string[] {
  const lower = tier > 1 ? TIER_COUNTRIES[(tier - 1) as Tier] : [];
  const upper = tier < 4 ? TIER_COUNTRIES[(tier + 1) as Tier] : [];
  return [...lower, ...upper];
}

// answeredCount(0-based): 지금까지 푼 문제 수. usedCodes: 이번 게임에서 이미 정답으로 낸 코드.
export function generateQuestion(
  answeredCount: number,
  usedCodes: Set<string>,
  rng: () => number = Math.random,
): QuizQuestion {
  const tier = tierForQuestionIndex(answeredCount);
  const tierPool = TIER_COUNTRIES[tier];
  let available = tierPool.filter((c) => !usedCodes.has(c));
  // 티어가 소진되면(드문 케이스) 중복을 허용한다.
  if (available.length === 0) available = tierPool;

  const answerCode = shuffle(available, rng)[0];
  const distractors = pickDistractors(answerCode, tierPool, adjacentPool(tier), rng);
  const choices = shuffle([answerCode, ...distractors], rng);
  return { answerCode, choices };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/flagQuiz/quizGenerator.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/flagQuiz/quizGenerator.ts src/features/flagQuiz/quizGenerator.test.ts
git commit -m "feat(flag-quiz): 티어 기반 다음 문제 생성"
```

---

## Task 7: `gameMachine.ts` — 순수 게임 상태 머신

**Files:**
- Create: `src/features/flagQuiz/gameMachine.ts`
- Test: `src/features/flagQuiz/gameMachine.test.ts`

- [ ] **Step 1: Write the failing test**

`src/features/flagQuiz/gameMachine.test.ts`:

```ts
import { createInitialState, startGame, answerQuestion, INITIAL_LIVES } from "./gameMachine";

function seqRng(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("gameMachine", () => {
  it("초기 상태는 idle, 목숨 가득, 점수 0", () => {
    const s = createInitialState();
    expect(s.status).toBe("idle");
    expect(s.lives).toBe(INITIAL_LIVES);
    expect(s.score).toBe(0);
    expect(s.current).toBeNull();
  });

  it("startGame은 playing 상태와 첫 문제를 만든다", () => {
    const s = startGame(seqRng([0.1, 0.2, 0.3, 0.4]));
    expect(s.status).toBe("playing");
    expect(s.current).not.toBeNull();
    expect(s.answeredCount).toBe(0);
  });

  it("정답이면 점수가 오르고 목숨은 유지, 다음 문제로 진행", () => {
    const s0 = startGame(seqRng([0.1, 0.2, 0.3, 0.4]));
    const s1 = answerQuestion(s0, s0.current!.answerCode, seqRng([0.5, 0.6, 0.7, 0.8]));
    expect(s1.score).toBe(1);
    expect(s1.lives).toBe(INITIAL_LIVES);
    expect(s1.answeredCount).toBe(1);
    expect(s1.status).toBe("playing");
    expect(s1.current).not.toBeNull();
  });

  it("오답이면 목숨이 줄고 점수는 유지", () => {
    const s0 = startGame(seqRng([0.1, 0.2, 0.3, 0.4]));
    const wrong = s0.current!.choices.find((c) => c !== s0.current!.answerCode)!;
    const s1 = answerQuestion(s0, wrong, seqRng([0.5, 0.6, 0.7, 0.8]));
    expect(s1.score).toBe(0);
    expect(s1.lives).toBe(INITIAL_LIVES - 1);
  });

  it("선택지 null(타임아웃)은 오답으로 처리한다", () => {
    const s0 = startGame(seqRng([0.1, 0.2, 0.3, 0.4]));
    const s1 = answerQuestion(s0, null, seqRng([0.5, 0.6, 0.7, 0.8]));
    expect(s1.lives).toBe(INITIAL_LIVES - 1);
  });

  it("목숨이 0이 되면 status는 over, current는 마지막 문제 유지", () => {
    let s = startGame(seqRng([0.1, 0.2, 0.3, 0.4]));
    for (let i = 0; i < INITIAL_LIVES; i++) {
      const wrong = s.current!.choices.find((c) => c !== s.current!.answerCode)!;
      s = answerQuestion(s, wrong, seqRng([0.5, 0.6, 0.7, 0.8]));
    }
    expect(s.status).toBe("over");
    expect(s.current).not.toBeNull();
  });

  it("같은 게임 안에서 정답 코드는 usedCodes에 누적된다", () => {
    const s0 = startGame(seqRng([0.1, 0.2, 0.3, 0.4]));
    const first = s0.current!.answerCode;
    const s1 = answerQuestion(s0, first, seqRng([0.5, 0.6, 0.7, 0.8]));
    expect(s1.usedCodes).toContain(first);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/flagQuiz/gameMachine.test.ts`
Expected: FAIL — `Cannot find module './gameMachine'`

- [ ] **Step 3: Write minimal implementation**

`src/features/flagQuiz/gameMachine.ts`:

```ts
import { generateQuestion, type QuizQuestion } from "./quizGenerator";

export const INITIAL_LIVES = 2;

export type GameStatus = "idle" | "playing" | "over";

export type GameState = {
  status: GameStatus;
  lives: number;
  score: number;
  // 지금까지 답한 문제 수.
  answeredCount: number;
  // 이번 게임에서 정답으로 출제된 코드들 (비복원 추출용).
  usedCodes: string[];
  // 현재(또는 게임오버 시 마지막) 문제.
  current: QuizQuestion | null;
};

export function createInitialState(): GameState {
  return {
    status: "idle",
    lives: INITIAL_LIVES,
    score: 0,
    answeredCount: 0,
    usedCodes: [],
    current: null,
  };
}

export function startGame(rng: () => number = Math.random): GameState {
  return {
    status: "playing",
    lives: INITIAL_LIVES,
    score: 0,
    answeredCount: 0,
    usedCodes: [],
    current: generateQuestion(0, new Set(), rng),
  };
}

// selectedCode === null 은 타임아웃(오답 처리).
export function answerQuestion(
  state: GameState,
  selectedCode: string | null,
  rng: () => number = Math.random,
): GameState {
  if (state.status !== "playing" || !state.current) return state;

  const isCorrect = selectedCode === state.current.answerCode;
  const lives = isCorrect ? state.lives : state.lives - 1;
  const score = isCorrect ? state.score + 1 : state.score;
  const answeredCount = state.answeredCount + 1;
  const usedCodes = [...state.usedCodes, state.current.answerCode];

  if (lives <= 0) {
    return { ...state, status: "over", lives: 0, score, answeredCount, usedCodes };
  }
  return {
    status: "playing",
    lives,
    score,
    answeredCount,
    usedCodes,
    current: generateQuestion(answeredCount, new Set(usedCodes), rng),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/flagQuiz/gameMachine.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/flagQuiz/gameMachine.ts src/features/flagQuiz/gameMachine.test.ts
git commit -m "feat(flag-quiz): 순수 게임 상태 머신"
```

---

## Task 8: `scoreService.ts` — Supabase 점수 조회/제출

**Files:**
- Create: `src/features/flagQuiz/scoreService.ts`
- Test: `src/features/flagQuiz/scoreService.test.ts`

배경: 기존 `src/features/auth/userTier.ts`가 `supabase.from(...).select(...).eq(...).maybeSingle()` 패턴을 쓴다. RPC는 `supabase.rpc(name, params)`.

- [ ] **Step 1: Write the failing test**

`src/features/flagQuiz/scoreService.test.ts`:

```ts
const mockMaybeSingle = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockRpc = jest.fn();

jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: (...a: unknown[]) => mockFrom(...a),
    rpc: (...a: unknown[]) => mockRpc(...a),
  },
}));

import { fetchMyQuizScore, submitQuizScore } from "./scoreService";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchMyQuizScore", () => {
  it("행이 있으면 best/last를 반환한다", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { best_score: 12, last_score: 7 }, error: null });
    const out = await fetchMyQuizScore("user-1");
    expect(mockFrom).toHaveBeenCalledWith("flag_quiz_scores");
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(out).toEqual({ bestScore: 12, lastScore: 7 });
  });

  it("행이 없거나 에러면 null", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await fetchMyQuizScore("user-1")).toBeNull();
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await fetchMyQuizScore("user-1")).toBeNull();
  });
});

describe("submitQuizScore", () => {
  it("RPC submit_flag_quiz_score를 점수와 함께 호출하고 갱신된 값을 반환한다", async () => {
    mockRpc.mockResolvedValue({
      data: [{ best_score: 15, last_score: 15 }],
      error: null,
    });
    const out = await submitQuizScore(15);
    expect(mockRpc).toHaveBeenCalledWith("submit_flag_quiz_score", { p_score: 15 });
    expect(out).toEqual({ bestScore: 15, lastScore: 15 });
  });

  it("에러면 null", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await submitQuizScore(15)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/features/flagQuiz/scoreService.test.ts`
Expected: FAIL — `Cannot find module './scoreService'`

- [ ] **Step 3: Write minimal implementation**

`src/features/flagQuiz/scoreService.ts`:

```ts
import { supabase } from "../../lib/supabase";

export type QuizScore = {
  bestScore: number;
  lastScore: number;
};

// 본인 점수 행 조회. 행이 없거나 에러면 null (비로그인/오프라인 정상 시나리오).
export async function fetchMyQuizScore(userId: string): Promise<QuizScore | null> {
  const { data, error } = await supabase
    .from("flag_quiz_scores")
    .select("best_score,last_score")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    bestScore: (data.best_score as number | null) ?? 0,
    lastScore: (data.last_score as number | null) ?? 0,
  };
}

// 게임 종료 점수 제출. RPC가 last는 항상, best는 greatest로 원자적 upsert 후
// 갱신된 행을 돌려준다. 에러면 null (게임 흐름에 영향 주지 않음).
export async function submitQuizScore(score: number): Promise<QuizScore | null> {
  const { data, error } = await supabase.rpc("submit_flag_quiz_score", {
    p_score: score,
  });
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    bestScore: (row.best_score as number | null) ?? 0,
    lastScore: (row.last_score as number | null) ?? 0,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/features/flagQuiz/scoreService.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/flagQuiz/scoreService.ts src/features/flagQuiz/scoreService.test.ts
git commit -m "feat(flag-quiz): Supabase 점수 조회/제출 서비스"
```

---

## Task 9: i18n 키 추가 (10개 locale)

**Files:**
- Modify: `src/i18n/locales/de.json`, `en.json`, `es.json`, `fr.json`, `it.json`, `ja.json`, `ko.json`, `ru.json`, `zh-CN.json`, `zh-TW.json`

각 locale JSON의 최상위에 `gamesHub`, `flagQuiz` 두 블록을 추가하고, 기존 `home` 블록에 `gamesBtnA11y` 키를 추가한다. 키 구조는 모든 locale 동일하고 값만 번역한다.

- [ ] **Step 1: 10개 locale에 키 추가**

각 파일의 최상위 객체에 아래 두 블록을 추가한다 (기존 키 뒤, 마지막 `}` 앞). 그리고 기존 `"home": { ... }` 블록 안에 `"gamesBtnA11y"` 키를 추가한다.

**ko.json** — `home` 블록에 추가: `"gamesBtnA11y": "게임"`. 최상위에 추가:
```json
"gamesHub": {
  "title": "게임",
  "flagQuizTitle": "국기 퀴즈",
  "flagQuizDesc": "국기를 보고 나라를 맞혀보세요"
},
"flagQuiz": {
  "start": "시작",
  "bestScore": "최고 점수 {{score}}",
  "noBestScore": "첫 도전을 기다리고 있어요",
  "loginToSave": "로그인하면 기록이 저장돼요",
  "loadingScore": "기록 불러오는 중…",
  "score": "점수 {{score}}",
  "gameOver": "게임 오버",
  "finalScore": "{{score}}개 정답",
  "newBest": "최고 기록 경신!",
  "bestScoreLabel": "최고 {{score}}",
  "retry": "다시하기",
  "exit": "나가기"
}
```

**en.json** — `home`에 `"gamesBtnA11y": "Games"`. 최상위:
```json
"gamesHub": {
  "title": "Games",
  "flagQuizTitle": "Flag Quiz",
  "flagQuizDesc": "See the flag, name the country"
},
"flagQuiz": {
  "start": "Start",
  "bestScore": "Best score {{score}}",
  "noBestScore": "Waiting for your first run",
  "loginToSave": "Log in to save your scores",
  "loadingScore": "Loading your score…",
  "score": "Score {{score}}",
  "gameOver": "Game Over",
  "finalScore": "{{score}} correct",
  "newBest": "New best score!",
  "bestScoreLabel": "Best {{score}}",
  "retry": "Play again",
  "exit": "Exit"
}
```

**ja.json** — `home`에 `"gamesBtnA11y": "ゲーム"`. 최상위:
```json
"gamesHub": {
  "title": "ゲーム",
  "flagQuizTitle": "国旗クイズ",
  "flagQuizDesc": "国旗を見て国名を当てよう"
},
"flagQuiz": {
  "start": "スタート",
  "bestScore": "ベストスコア {{score}}",
  "noBestScore": "最初の挑戦をお待ちしています",
  "loginToSave": "ログインするとスコアが保存されます",
  "loadingScore": "スコアを読み込み中…",
  "score": "スコア {{score}}",
  "gameOver": "ゲームオーバー",
  "finalScore": "正解 {{score}}",
  "newBest": "自己ベスト更新！",
  "bestScoreLabel": "ベスト {{score}}",
  "retry": "もう一度",
  "exit": "終了"
}
```

**zh-CN.json** — `home`에 `"gamesBtnA11y": "游戏"`. 최상위:
```json
"gamesHub": {
  "title": "游戏",
  "flagQuizTitle": "国旗问答",
  "flagQuizDesc": "看国旗，猜国家"
},
"flagQuiz": {
  "start": "开始",
  "bestScore": "最高分 {{score}}",
  "noBestScore": "等待你的第一次挑战",
  "loginToSave": "登录后即可保存成绩",
  "loadingScore": "正在加载成绩…",
  "score": "得分 {{score}}",
  "gameOver": "游戏结束",
  "finalScore": "答对 {{score}} 题",
  "newBest": "刷新最高分！",
  "bestScoreLabel": "最高 {{score}}",
  "retry": "再玩一次",
  "exit": "退出"
}
```

**zh-TW.json** — `home`에 `"gamesBtnA11y": "遊戲"`. 최상위:
```json
"gamesHub": {
  "title": "遊戲",
  "flagQuizTitle": "國旗問答",
  "flagQuizDesc": "看國旗，猜國家"
},
"flagQuiz": {
  "start": "開始",
  "bestScore": "最高分 {{score}}",
  "noBestScore": "等待你的第一次挑戰",
  "loginToSave": "登入後即可儲存成績",
  "loadingScore": "正在載入成績…",
  "score": "得分 {{score}}",
  "gameOver": "遊戲結束",
  "finalScore": "答對 {{score}} 題",
  "newBest": "刷新最高分！",
  "bestScoreLabel": "最高 {{score}}",
  "retry": "再玩一次",
  "exit": "離開"
}
```

**es.json** — `home`에 `"gamesBtnA11y": "Juegos"`. 최상위:
```json
"gamesHub": {
  "title": "Juegos",
  "flagQuizTitle": "Quiz de banderas",
  "flagQuizDesc": "Mira la bandera y adivina el país"
},
"flagQuiz": {
  "start": "Empezar",
  "bestScore": "Mejor puntuación {{score}}",
  "noBestScore": "Esperando tu primer intento",
  "loginToSave": "Inicia sesión para guardar tus puntuaciones",
  "loadingScore": "Cargando tu puntuación…",
  "score": "Puntuación {{score}}",
  "gameOver": "Fin del juego",
  "finalScore": "{{score}} aciertos",
  "newBest": "¡Nuevo récord!",
  "bestScoreLabel": "Mejor {{score}}",
  "retry": "Jugar de nuevo",
  "exit": "Salir"
}
```

**de.json** — `home`에 `"gamesBtnA11y": "Spiele"`. 최상위:
```json
"gamesHub": {
  "title": "Spiele",
  "flagQuizTitle": "Flaggen-Quiz",
  "flagQuizDesc": "Flagge ansehen, Land erraten"
},
"flagQuiz": {
  "start": "Start",
  "bestScore": "Bestwert {{score}}",
  "noBestScore": "Warte auf deinen ersten Versuch",
  "loginToSave": "Melde dich an, um deine Punkte zu speichern",
  "loadingScore": "Punktestand wird geladen…",
  "score": "Punkte {{score}}",
  "gameOver": "Spiel vorbei",
  "finalScore": "{{score}} richtig",
  "newBest": "Neuer Bestwert!",
  "bestScoreLabel": "Best {{score}}",
  "retry": "Nochmal spielen",
  "exit": "Beenden"
}
```

**fr.json** — `home`에 `"gamesBtnA11y": "Jeux"`. 최상위:
```json
"gamesHub": {
  "title": "Jeux",
  "flagQuizTitle": "Quiz des drapeaux",
  "flagQuizDesc": "Regardez le drapeau, devinez le pays"
},
"flagQuiz": {
  "start": "Commencer",
  "bestScore": "Meilleur score {{score}}",
  "noBestScore": "En attente de votre premier essai",
  "loginToSave": "Connectez-vous pour enregistrer vos scores",
  "loadingScore": "Chargement de votre score…",
  "score": "Score {{score}}",
  "gameOver": "Partie terminée",
  "finalScore": "{{score}} bonnes réponses",
  "newBest": "Nouveau record !",
  "bestScoreLabel": "Record {{score}}",
  "retry": "Rejouer",
  "exit": "Quitter"
}
```

**it.json** — `home`에 `"gamesBtnA11y": "Giochi"`. 최상위:
```json
"gamesHub": {
  "title": "Giochi",
  "flagQuizTitle": "Quiz delle bandiere",
  "flagQuizDesc": "Guarda la bandiera, indovina il paese"
},
"flagQuiz": {
  "start": "Inizia",
  "bestScore": "Miglior punteggio {{score}}",
  "noBestScore": "In attesa del tuo primo tentativo",
  "loginToSave": "Accedi per salvare i tuoi punteggi",
  "loadingScore": "Caricamento del punteggio…",
  "score": "Punteggio {{score}}",
  "gameOver": "Game Over",
  "finalScore": "{{score}} corrette",
  "newBest": "Nuovo record!",
  "bestScoreLabel": "Record {{score}}",
  "retry": "Gioca ancora",
  "exit": "Esci"
}
```

**ru.json** — `home`에 `"gamesBtnA11y": "Игры"`. 최상위:
```json
"gamesHub": {
  "title": "Игры",
  "flagQuizTitle": "Викторина флагов",
  "flagQuizDesc": "Посмотрите на флаг и угадайте страну"
},
"flagQuiz": {
  "start": "Начать",
  "bestScore": "Лучший результат {{score}}",
  "noBestScore": "Ждём вашу первую попытку",
  "loginToSave": "Войдите, чтобы сохранять результаты",
  "loadingScore": "Загрузка результата…",
  "score": "Счёт {{score}}",
  "gameOver": "Игра окончена",
  "finalScore": "Правильных: {{score}}",
  "newBest": "Новый рекорд!",
  "bestScoreLabel": "Рекорд {{score}}",
  "retry": "Играть снова",
  "exit": "Выйти"
}
```

- [ ] **Step 2: 10개 JSON 모두 파싱 가능 + 키 존재 검증**

Run:
```bash
node -e "['de','en','es','fr','it','ja','ko','ru','zh-CN','zh-TW'].forEach(l=>{const j=require('./src/i18n/locales/'+l+'.json'); if(!j.gamesHub||!j.flagQuiz||!j.home.gamesBtnA11y) throw new Error('missing keys in '+l); if(!j.flagQuiz.retry||!j.flagQuiz.gameOver) throw new Error('missing flagQuiz keys in '+l);}); console.log('all 10 locales OK');"
```
Expected: `all 10 locales OK`

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat(flag-quiz): 게임 허브/국기 퀴즈 i18n 키 10개 locale 추가"
```

---

## Task 10: `FlagCard.tsx` — 국기 표시 컴포넌트

**Files:**
- Create: `src/features/flagQuiz/components/FlagCard.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`src/features/flagQuiz/components/FlagCard.tsx`:

```tsx
import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import * as Flags from "country-flag-icons/string/3x2";

import { useTheme } from "../../../theme/themeStore";

const FLAGS = Flags as unknown as Record<string, string>;

// 3x2 비율 국기를 SVG로 그린다. 코드에 해당하는 국기가 없으면 빈 박스.
export function FlagCard({ code, width }: { code: string; width: number }) {
  const theme = useTheme();
  const height = Math.round((width * 2) / 3);
  const xml = FLAGS[code];
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: theme.flagBoxBg,
        borderWidth: 1,
        borderColor: theme.cardBorder,
      }}
    >
      {xml ? <SvgXml xml={xml} width={width} height={height} /> : null}
    </View>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (이 파일 관련). `country-flag-icons/string/3x2`에 타입 선언이 없어 에러가 나면, `src/features/flagQuiz/country-flag-icons.d.ts`를 생성:
```ts
declare module "country-flag-icons/string/3x2" {
  const flags: Record<string, string>;
  export = flags;
}
```
그리고 `FlagCard.tsx`의 `import * as Flags`를 `import Flags from "country-flag-icons/string/3x2";`로 바꾸고 `const FLAGS = Flags as Record<string, string>;`로 단순화한다. 다시 `npx tsc --noEmit` 실행해 통과 확인.

- [ ] **Step 3: Commit**

```bash
git add src/features/flagQuiz/components/FlagCard.tsx src/features/flagQuiz/country-flag-icons.d.ts
git commit -m "feat(flag-quiz): 국기 SVG 표시 컴포넌트"
```

(`.d.ts`를 만들지 않았다면 그 파일은 git add에서 제외한다.)

---

## Task 11: `LivesIndicator.tsx` · `TimerBar.tsx` — 표시 컴포넌트

**Files:**
- Create: `src/features/flagQuiz/components/LivesIndicator.tsx`
- Create: `src/features/flagQuiz/components/TimerBar.tsx`

- [ ] **Step 1: LivesIndicator 작성**

`src/features/flagQuiz/components/LivesIndicator.tsx`:

```tsx
import { View } from "react-native";
import { Heart } from "lucide-react-native";

import { INITIAL_LIVES } from "../gameMachine";
import { useTheme } from "../../../theme/themeStore";

// 남은 목숨을 하트로 표시한다. 잃은 목숨은 흐린 외곽선 하트.
export function LivesIndicator({ lives }: { lives: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {Array.from({ length: INITIAL_LIVES }).map((_, i) => {
        const filled = i < lives;
        return (
          <Heart
            key={i}
            size={22}
            color={filled ? theme.dangerOn : theme.textMuted}
            fill={filled ? theme.dangerOn : "transparent"}
          />
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: TimerBar 작성**

`src/features/flagQuiz/components/TimerBar.tsx`:

```tsx
import { View } from "react-native";

import { useTheme } from "../../../theme/themeStore";

// secondsLeft(0~total)를 가로 막대 너비로 표시한다. 3초 이하면 경고색.
export function TimerBar({
  secondsLeft,
  total,
}: {
  secondsLeft: number;
  total: number;
}) {
  const theme = useTheme();
  const ratio = Math.max(0, Math.min(1, secondsLeft / total));
  const warning = secondsLeft <= 3;
  return (
    <View
      style={{
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.cardBorder,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${ratio * 100}%`,
          backgroundColor: warning ? theme.dangerOn : theme.accent,
        }}
      />
    </View>
  );
}
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 이 두 파일 관련 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add src/features/flagQuiz/components/LivesIndicator.tsx src/features/flagQuiz/components/TimerBar.tsx
git commit -m "feat(flag-quiz): 목숨/타이머 표시 컴포넌트"
```

---

## Task 12: `ChoiceButton.tsx` — 4지선다 버튼

**Files:**
- Create: `src/features/flagQuiz/components/ChoiceButton.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`src/features/flagQuiz/components/ChoiceButton.tsx`:

```tsx
import { Pressable, Text } from "react-native";

import { useTheme } from "../../../theme/themeStore";

// 정답/오답 피드백 색 (테마 토큰에 green 계열이 없어 컴포넌트 로컬 상수로 둔다).
const CORRECT_BG = "#16a34a";
const WRONG_BG = "#dc2626";

export type ChoiceState = "idle" | "correct" | "wrong" | "dimmed";

export function ChoiceButton({
  label,
  state,
  disabled,
  onPress,
}: {
  label: string;
  state: ChoiceState;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  let bg = theme.optionBtnBg;
  let border = theme.optionBtnBorder;
  let textColor = theme.textPrimary;
  if (state === "correct") {
    bg = CORRECT_BG;
    border = CORRECT_BG;
    textColor = "#ffffff";
  } else if (state === "wrong") {
    bg = WRONG_BG;
    border = WRONG_BG;
    textColor = "#ffffff";
  } else if (state === "dimmed") {
    textColor = theme.textMuted;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: border,
        backgroundColor:
          pressed && state === "idle" ? theme.optionBtnPressedBg : bg,
        opacity: state === "dimmed" ? 0.5 : 1,
      })}
    >
      <Text
        style={{
          color: textColor,
          fontSize: 17,
          fontWeight: "700",
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 이 파일 관련 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/features/flagQuiz/components/ChoiceButton.tsx
git commit -m "feat(flag-quiz): 4지선다 선택 버튼"
```

---

## Task 13: `useFlagQuizGame.ts` — 게임 훅

**Files:**
- Create: `src/features/flagQuiz/useFlagQuizGame.ts`

게임 머신 + 10초 카운트다운 + "정답 공개(reveal) 1초" 오케스트레이션을 담당한다. 단일 타이머가 권위를 갖는다.

- [ ] **Step 1: 훅 작성**

`src/features/flagQuiz/useFlagQuizGame.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from "react";

import {
  answerQuestion,
  createInitialState,
  startGame,
  type GameState,
} from "./gameMachine";

export const QUESTION_SECONDS = 10;
const TICK_MS = 100;
const REVEAL_MS = 1000;

// 정답 공개 단계 정보. 1초간 정답/내 선택을 보여준 뒤 다음 문제로.
export type Reveal = {
  selected: string | null; // null = 타임아웃
  answer: string;
  correct: boolean;
};

export function useFlagQuizGame() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [reveal, setReveal] = useState<Reveal | null>(null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // select 안에서 최신 state를 읽기 위한 ref.
  const stateRef = useRef(state);
  stateRef.current = state;

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (revealRef.current) clearTimeout(revealRef.current);
    tickRef.current = null;
    revealRef.current = null;
  }, []);

  const startCountdown = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    setSecondsLeft(QUESTION_SECONDS);
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        const next = Math.round((s - TICK_MS / 1000) * 10) / 10;
        if (next <= 0) {
          if (tickRef.current) clearInterval(tickRef.current);
          tickRef.current = null;
          // 타임아웃 → 오답 처리.
          handleSelect(null);
          return 0;
        }
        return next;
      });
    }, TICK_MS);
  }, []);

  // 선택(또는 타임아웃). reveal 1초 후 게임 머신을 전이시킨다.
  const handleSelect = useCallback(
    (code: string | null) => {
      const cur = stateRef.current;
      if (cur.status !== "playing" || !cur.current || reveal) return;
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      const answer = cur.current.answerCode;
      setReveal({ selected: code, answer, correct: code === answer });
      revealRef.current = setTimeout(() => {
        setReveal(null);
        const nextState = answerQuestion(cur, code);
        setState(nextState);
        if (nextState.status === "playing") startCountdown();
      }, REVEAL_MS);
    },
    [reveal, startCountdown],
  );

  const start = useCallback(() => {
    clearTimers();
    setReveal(null);
    setState(startGame());
    startCountdown();
  }, [clearTimers, startCountdown]);

  const restart = start;

  useEffect(() => clearTimers, [clearTimers]);

  return {
    status: state.status,
    lives: state.lives,
    score: state.score,
    current: state.current,
    secondsLeft,
    reveal,
    start,
    restart,
    select: handleSelect,
  };
}
```

> 참고: `startCountdown`/`handleSelect`가 서로를 참조하므로 `useCallback` deps에서 일부 경고가 날 수 있다. 의존 순환을 피하려고 `handleSelect`는 `startCountdown`에만 의존하고, `startCountdown`은 `handleSelect`를 클로저로 호출한다 — 함수 선언 순서상 `startCountdown` 안의 `handleSelect`는 같은 렌더의 최신 클로저를 참조한다. 동작에 문제가 없으면 그대로 두고, ESLint exhaustive-deps 경고는 무시한다.

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 이 파일 관련 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/features/flagQuiz/useFlagQuizGame.ts
git commit -m "feat(flag-quiz): 게임 훅 (타이머 + 정답 공개 오케스트레이션)"
```

---

## Task 14: `QuizStartView.tsx` — 시작 대기 화면

**Files:**
- Create: `src/features/flagQuiz/components/QuizStartView.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`src/features/flagQuiz/components/QuizStartView.tsx`:

```tsx
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/themeStore";

// 대기 화면. bestScore: 로그인 사용자의 최고 점수(없으면 null).
// loading: 점수 조회 중. signedIn: 로그인 여부.
export function QuizStartView({
  bestScore,
  loading,
  signedIn,
  onStart,
}: {
  bestScore: number | null;
  loading: boolean;
  signedIn: boolean;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  let scoreLine: string;
  if (!signedIn) scoreLine = t("flagQuiz.loginToSave");
  else if (loading) scoreLine = t("flagQuiz.loadingScore");
  else if (bestScore != null && bestScore > 0)
    scoreLine = t("flagQuiz.bestScore", { score: bestScore });
  else scoreLine = t("flagQuiz.noBestScore");

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 28, padding: 24 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: theme.textPrimary }}>
        {t("gamesHub.flagQuizTitle")}
      </Text>
      <Text style={{ fontSize: 15, color: theme.textSecondary, textAlign: "center" }}>
        {t("gamesHub.flagQuizDesc")}
      </Text>
      <View style={{ height: 22, justifyContent: "center" }}>
        {loading ? (
          <ActivityIndicator color={theme.accent} />
        ) : (
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.textPrimary }}>
            {scoreLine}
          </Text>
        )}
      </View>
      <Pressable
        onPress={onStart}
        style={({ pressed }) => ({
          backgroundColor: theme.accent,
          paddingVertical: 16,
          paddingHorizontal: 48,
          borderRadius: 16,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: theme.accentOn, fontSize: 18, fontWeight: "800" }}>
          {t("flagQuiz.start")}
        </Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 이 파일 관련 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/features/flagQuiz/components/QuizStartView.tsx
git commit -m "feat(flag-quiz): 시작 대기 화면"
```

---

## Task 15: `GameOverView.tsx` — 게임 오버 화면

**Files:**
- Create: `src/features/flagQuiz/components/GameOverView.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`src/features/flagQuiz/components/GameOverView.tsx`:

```tsx
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/themeStore";

// 게임 오버 화면. score: 이번 점수. bestScore: 갱신된 최고(없으면 null).
// isNewBest: 이번 게임이 최고 기록을 경신했는지.
export function GameOverView({
  score,
  bestScore,
  isNewBest,
  onRetry,
  onExit,
}: {
  score: number;
  bestScore: number | null;
  isNewBest: boolean;
  onRetry: () => void;
  onExit: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: theme.textPrimary }}>
        {t("flagQuiz.gameOver")}
      </Text>
      <Text style={{ fontSize: 40, fontWeight: "900", color: theme.accent }}>
        {t("flagQuiz.finalScore", { score })}
      </Text>
      {isNewBest ? (
        <Text style={{ fontSize: 16, fontWeight: "800", color: theme.accent }}>
          {t("flagQuiz.newBest")}
        </Text>
      ) : bestScore != null ? (
        <Text style={{ fontSize: 15, color: theme.textSecondary }}>
          {t("flagQuiz.bestScoreLabel", { score: bestScore })}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => ({
            backgroundColor: theme.accent,
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 14,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: theme.accentOn, fontSize: 16, fontWeight: "800" }}>
            {t("flagQuiz.retry")}
          </Text>
        </Pressable>
        <Pressable
          onPress={onExit}
          style={({ pressed }) => ({
            backgroundColor: theme.optionBtnBg,
            borderWidth: 1,
            borderColor: theme.optionBtnBorder,
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 14,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "800" }}>
            {t("flagQuiz.exit")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 이 파일 관련 에러 없음.

- [ ] **Step 3: Commit**

```bash
git add src/features/flagQuiz/components/GameOverView.tsx
git commit -m "feat(flag-quiz): 게임 오버 화면"
```

---

## Task 16: `FlagQuizScreen.tsx` — 화면 컨테이너

**Files:**
- Create: `src/features/flagQuiz/FlagQuizScreen.tsx`

대기/플레이/게임오버 상태를 분기하고, 점수 fetch/submit과 게임 훅을 연결한다.

- [ ] **Step 1: 컴포넌트 작성**

`src/features/flagQuiz/FlagQuizScreen.tsx`:

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { getCountryName } from "../../lib/countryName";
import { getCurrentLocale } from "../../i18n";
import { useAuthStore } from "../auth/authStore";
import { useTheme } from "../../theme/themeStore";
import { ChoiceButton, type ChoiceState } from "./components/ChoiceButton";
import { FlagCard } from "./components/FlagCard";
import { GameOverView } from "./components/GameOverView";
import { LivesIndicator } from "./components/LivesIndicator";
import { QuizStartView } from "./components/QuizStartView";
import { TimerBar } from "./components/TimerBar";
import { fetchMyQuizScore, submitQuizScore } from "./scoreService";
import { QUESTION_SECONDS, useFlagQuizGame } from "./useFlagQuizGame";

export function FlagQuizScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const game = useFlagQuizGame();

  const [bestScore, setBestScore] = useState<number | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  // 이번 게임오버 처리(점수 제출)를 1회만 하기 위한 가드.
  const submittedRef = useRef(false);

  // 대기 화면 진입 시 최고 점수 조회.
  useEffect(() => {
    if (!userId) {
      setBestScore(null);
      return;
    }
    let cancelled = false;
    setLoadingScore(true);
    fetchMyQuizScore(userId).then((row) => {
      if (cancelled) return;
      setBestScore(row?.bestScore ?? null);
      setLoadingScore(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 게임오버 전이 시 점수 제출 (로그인 사용자만, 1회).
  useEffect(() => {
    if (game.status !== "over" || submittedRef.current) return;
    submittedRef.current = true;
    const finalScore = game.score;
    const prevBest = bestScore ?? 0;
    setIsNewBest(finalScore > prevBest);
    if (userId) {
      submitQuizScore(finalScore).then((row) => {
        if (row) setBestScore(row.bestScore);
      });
    }
  }, [game.status, game.score, userId, bestScore]);

  const handleStart = useCallback(() => {
    submittedRef.current = false;
    setIsNewBest(false);
    game.start();
  }, [game]);

  const handleSelect = useCallback(
    (code: string) => {
      if (game.reveal) return;
      const correct = code === game.current?.answerCode;
      Haptics.notificationAsync(
        correct
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
      game.select(code);
    },
    [game],
  );

  const locale = getCurrentLocale();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.homeBg }} edges={["top", "bottom"]}>
      {/* 헤더 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Pressable onPress={onClose} hitSlop={10} style={{ padding: 8 }}>
          <ChevronLeft color={theme.textPrimary} size={26} />
        </Pressable>
      </View>

      {game.status === "idle" ? (
        <QuizStartView
          bestScore={bestScore}
          loading={loadingScore}
          signedIn={!!userId}
          onStart={handleStart}
        />
      ) : game.status === "over" ? (
        <GameOverView
          score={game.score}
          bestScore={bestScore}
          isNewBest={isNewBest}
          onRetry={handleStart}
          onExit={onClose}
        />
      ) : game.current ? (
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          {/* 상단: 목숨 + 점수 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <LivesIndicator lives={game.lives} />
            <Text style={{ fontSize: 16, fontWeight: "800", color: theme.textPrimary }}>
              {t("flagQuiz.score", { score: game.score })}
            </Text>
          </View>

          <TimerBar secondsLeft={game.secondsLeft} total={QUESTION_SECONDS} />

          {/* 국기 */}
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <FlagCard code={game.current.answerCode} width={220} />
          </View>

          {/* 4지선다 */}
          <View style={{ gap: 12 }}>
            {game.current.choices.map((code) => {
              let cState: ChoiceState = "idle";
              if (game.reveal) {
                if (code === game.reveal.answer) cState = "correct";
                else if (code === game.reveal.selected) cState = "wrong";
                else cState = "dimmed";
              }
              return (
                <ChoiceButton
                  key={code}
                  label={getCountryName(code, locale)}
                  state={cState}
                  disabled={!!game.reveal}
                  onPress={() => handleSelect(code)}
                />
              );
            })}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 이 파일 관련 에러 없음. `getCurrentLocale`이 `src/i18n`에서 export되는지 확인 — 안 되면 `src/i18n/index.ts`에서 정확한 export 이름을 찾아 맞춘다 (기존 `AllCountriesScreen.tsx`가 `import { getCurrentLocale } from "../i18n"` 사용 중이므로 존재함).

- [ ] **Step 3: Commit**

```bash
git add src/features/flagQuiz/FlagQuizScreen.tsx
git commit -m "feat(flag-quiz): 국기 퀴즈 화면 컨테이너"
```

---

## Task 17: `GamesHub` 화면

**Files:**
- Create: `src/screens/GamesHub/GameCard.tsx`
- Create: `src/screens/GamesHub/GamesHubScreen.tsx`

- [ ] **Step 1: GameCard 작성**

`src/screens/GamesHub/GameCard.tsx`:

```tsx
import { Pressable, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "../../theme/themeStore";

// 게임 허브의 게임 1개 카드.
export function GameCard({
  icon: Icon,
  title,
  description,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        padding: 18,
        borderRadius: 16,
        backgroundColor: theme.cardBg,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.accentSoftBg,
        }}
      >
        <Icon color={theme.accent} size={26} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, fontWeight: "800", color: theme.textPrimary }}>
          {title}
        </Text>
        <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 2 }}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 2: GamesHubScreen 작성**

`src/screens/GamesHub/GamesHubScreen.tsx`:

```tsx
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Flag } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";
import { GameCard } from "./GameCard";

export default function GamesHubScreen({
  onClose,
  onOpenFlagQuiz,
}: {
  onClose: () => void;
  onOpenFlagQuiz: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.homeBg }} edges={["top", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Pressable onPress={onClose} hitSlop={10} style={{ padding: 8 }}>
          <ChevronLeft color={theme.textPrimary} size={26} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "800", color: theme.textPrimary }}>
          {t("gamesHub.title")}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <GameCard
          icon={Flag}
          title={t("gamesHub.flagQuizTitle")}
          description={t("gamesHub.flagQuizDesc")}
          onPress={onOpenFlagQuiz}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 이 두 파일 관련 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add src/screens/GamesHub/
git commit -m "feat(flag-quiz): 게임 허브 화면"
```

---

## Task 18: 내비게이션 배선 (types · 래퍼 · RootNavigator)

**Files:**
- Modify: `src/navigation/types.ts`
- Create: `src/navigation/screens/GamesHubScreenNav.tsx`
- Create: `src/navigation/screens/FlagQuizScreenNav.tsx`
- Modify: `src/navigation/RootNavigator.tsx`

- [ ] **Step 1: `types.ts`에 라우트 추가**

`src/navigation/types.ts`의 `RootStackParamList`에 두 줄 추가 (`Main: ...` 줄 바로 뒤):

```ts
  GamesHub: undefined;
  FlagQuiz: undefined;
```

- [ ] **Step 2: `GamesHubScreenNav.tsx` 작성**

`src/navigation/screens/GamesHubScreenNav.tsx`:

```tsx
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import GamesHubScreen from "../../screens/GamesHub/GamesHubScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function GamesHubScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "GamesHub">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <GamesHubScreen
        onClose={() => navigation.goBack()}
        onOpenFlagQuiz={() => navigation.navigate("FlagQuiz")}
      />
    </>
  );
}
```

- [ ] **Step 3: `FlagQuizScreenNav.tsx` 작성**

`src/navigation/screens/FlagQuizScreenNav.tsx`:

```tsx
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { FlagQuizScreen } from "../../features/flagQuiz/FlagQuizScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function FlagQuizScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "FlagQuiz">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <FlagQuizScreen onClose={() => navigation.goBack()} />
    </>
  );
}
```

- [ ] **Step 4: `RootNavigator.tsx`에 등록**

`src/navigation/RootNavigator.tsx`에서:

import 추가 (기존 import 블록, 알파벳 순서에 맞게):
```ts
import FlagQuizScreenNav from "./screens/FlagQuizScreenNav";
import GamesHubScreenNav from "./screens/GamesHubScreenNav";
```

`<Stack.Screen name="Main" .../>` 바로 뒤에 추가:
```tsx
        <Stack.Screen name="GamesHub" component={GamesHubScreenNav} />
        <Stack.Screen name="FlagQuiz" component={FlagQuizScreenNav} />
```

- [ ] **Step 5: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 6: Commit**

```bash
git add src/navigation/types.ts src/navigation/RootNavigator.tsx src/navigation/screens/GamesHubScreenNav.tsx src/navigation/screens/FlagQuizScreenNav.tsx
git commit -m "feat(flag-quiz): 게임 허브/퀴즈 내비게이션 배선"
```

---

## Task 19: 홈 상단 앱바 진입 버튼

**Files:**
- Modify: `src/screens/MainScreen/index.tsx`
- Modify: `src/screens/MainScreen/styles.ts`

현재 `topAppBar`는 `flexDirection: row` + `justifyContent: "space-between"`이고 자식이 `<Text>` 타이틀 하나뿐이다. 우측에 `Pressable`을 추가하면 space-between이 자동으로 우측 정렬한다.

- [ ] **Step 1: `index.tsx`에 진입 버튼 추가**

`src/screens/MainScreen/index.tsx`:

import에 `Gamepad2` 추가 — 파일 상단의 lucide import는 없으므로 새 import 줄을 추가한다 (다른 import들 사이, react-native import 근처):
```ts
import { Gamepad2 } from "lucide-react-native";
```

`topAppBar` 블록을 다음으로 교체 (현재는 `<Text>` 하나만 있음):
```tsx
      <Animated.View style={[styles.topAppBar, topBarStyle]}>
        <Text style={styles.topAppBarTitle}>PixelTravel</Text>
        <Pressable
          onPress={() => navigation.navigate("GamesHub")}
          hitSlop={8}
          accessibilityLabel={t("home.gamesBtnA11y")}
          style={styles.gamesBtn}
        >
          <Gamepad2 color={theme.textPrimary} size={24} />
        </Pressable>
      </Animated.View>
```

(`Pressable`, `Text`는 이미 import되어 있고, `navigation`, `theme`, `t`도 이미 스코프에 있다.)

- [ ] **Step 2: `styles.ts`에 버튼 스타일 추가**

`src/screens/MainScreen/styles.ts`의 `topAppBarTitle` 스타일 객체 바로 뒤에 추가:
```ts
    gamesBtn: {
      padding: 4,
    },
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add src/screens/MainScreen/index.tsx src/screens/MainScreen/styles.ts
git commit -m "feat(flag-quiz): 홈 상단바에 게임 허브 진입 버튼"
```

---

## Task 20: 전체 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 테스트 실행**

Run: `npx jest`
Expected: 모든 테스트 PASS. 신규 6개 파일(shuffle, tiers, distractors, quizGenerator, gameMachine, scoreService) 포함.

- [ ] **Step 2: 타입체크 전체**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: i18n 검증 재실행**

Run:
```bash
node -e "['de','en','es','fr','it','ja','ko','ru','zh-CN','zh-TW'].forEach(l=>{const j=require('./src/i18n/locales/'+l+'.json'); if(!j.gamesHub||!j.flagQuiz||!j.home.gamesBtnA11y) throw new Error('missing in '+l);}); console.log('i18n OK');"
```
Expected: `i18n OK`

- [ ] **Step 4: 수동 검증 (디바이스/시뮬레이터)**

`/howtorun` 스킬로 안내된 명령을 사용자가 실행한 뒤, 다음을 직접 확인한다 (jest가 node 환경이라 RN UI 자동 테스트는 불가):
- 홈 상단바 우측 `Gamepad2` 아이콘 → 탭하면 `GamesHub` 진입
- `GamesHub`에서 "국기 퀴즈" 카드 → `FlagQuiz` 진입
- 대기 화면: 로그인 시 최고 점수(또는 "첫 도전" 안내) / 비로그인 시 "로그인하면 기록이 저장돼요"
- 시작 → 국기 표시, 4지선다, 10초 타이머 바가 줄어듦
- 정답: 초록 + 햅틱 → 약 1초 후 다음 문제 / 오답: 빨강 + 정답 표시 → 목숨 1 감소
- 10초 초과: 자동으로 오답 처리 + 목숨 감소
- 문제를 풀수록 난이도 상승(티어 1→4), 같은 게임에서 같은 국기 재출현 없음
- 목숨 2개 소진 → 게임 오버 화면(최종 점수, 최고 기록 경신 시 안내, 다시하기/나가기)
- 다시하기 → 새 게임 / 나가기 → `GamesHub`로 복귀
- 로그인 사용자: 게임 오버 후 다시 대기 화면 진입 시 최고 점수가 갱신되어 보임
- 언어를 바꿔(설정) 게임 화면 텍스트·국가 이름이 해당 언어로 나오는지 확인

- [ ] **Step 5: 최종 상태 확인**

Run: `git log --oneline -20 && git status`
Expected: Task 1~19의 커밋들이 쌓여 있고 working tree clean.

---

## Self-Review (작성자 체크 완료)

**1. 스펙 커버리지**
- 진입점(홈 상단바 Gamepad2) → Task 19 ✓
- GamesHub / FlagQuiz 스택 화면 → Task 17, 18 ✓
- 3상태(대기/플레이/게임오버) → Task 14, 15, 16 ✓
- 한 문제 흐름(국기+4지선다+10초, 정답/오답/타임아웃 피드백, ~1초 reveal) → Task 13, 16 ✓
- 목숨 2개, 무한, 점수=정답수 → Task 7 ✓
- 4티어 분류(popularityRank 재활용) + 진행 밴드 → Task 4 ✓
- 티어 내 랜덤 비복원 추출 → Task 6, 7 ✓
- 색상 유사도 오답 생성(flagColors.json 재활용) → Task 5 ✓
- DB 스키마(user_id PK 단일 행, RLS, greatest upsert) → Task 2 ✓
- 오프라인/비로그인(게임 가능, 점수 미저장, 안내 문구) → Task 16 ✓
- country-flag-icons SVG 렌더링 → Task 1, 10 ✓
- i18n 10개 locale → Task 9 ✓
- 파일 분리 → 파일 구조 섹션대로 ✓
- 테스트(distractors/tiers/quizGenerator/scoreService) → Task 4,5,6,8 ✓ (gameMachine·shuffle 추가)
- 의도적 단순화 2건(런타임 티어 분류, 비-reanimated 타이머 바)은 헤더에 명시 ✓

**2. 플레이스홀더 스캔:** "TBD/TODO/적절히 처리" 없음. 모든 코드 스텝에 실제 코드 포함 ✓

**3. 타입 일관성:** `QuizScore { bestScore, lastScore }`(scoreService) — Task 8·16 일치. `GameState`, `QuizQuestion`, `Tier`, `ChoiceState` 정의 Task와 사용 Task 시그니처 일치 ✓. `generateQuestion(answeredCount, usedCodes: Set, rng)` — Task 6 정의, Task 7 호출 일치 ✓.
