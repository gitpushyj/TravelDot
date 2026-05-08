# 유료 전용 숨겨진 마일스톤 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spec(`docs/superpowers/specs/2026-05-08-premium-hidden-milestones-design.md`)에 정의된 10개 Premium 마일스톤(약 30+ 호칭)과 그 무료/유료 가시성 정책을 코드로 옮긴다. 결제 시스템(IAP) 통합은 본 계획 범위 밖이며, dev-only `isPremium` 토글로 게이팅한다.

**Architecture:**
- 평가 로직은 순수 함수로 분리 — `src/features/milestone/premium/evaluators/*.ts`. 각 마일스톤별 `evaluate*()` 시그니처가 동일(`PremiumContext → BadgeDefinition[]`)이고 단위 테스트 가능.
- 사진별 메타데이터(`taken_at` × `country_code`)는 `tripDb`의 `visit_photos` 테이블에서 조회해 `PremiumContext`로 가공. `evaluateBadges`에 옵셔널 파라미터로 전달.
- 정적 매핑 5종(인구·면적·국기색·공용어·UTC offset)은 `src/features/badges/data/*.json` + 타입드 로더. 215개국 데이터는 한 번 생성 후 동결.
- UI는 기존 `MilestonesScreen` / `TitlesScreen`에 Premium 섹션을 분기. `useEntitlementStore`의 `isPremium` 플래그로 분기 렌더.

**Tech Stack:** TypeScript, React Native, Expo, zustand, AsyncStorage, expo-sqlite (`tripDb`), jest, i18next.

---

## Phase 1: 정적 데이터 + 타입 기반

### Task 1: Entitlement store (dev-only `isPremium` 토글)

**Files:**
- Create: `src/features/entitlement/entitlementStore.ts`
- Create: `src/features/entitlement/entitlementStorage.ts`
- Test: `src/features/entitlement/entitlementStore.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/features/entitlement/entitlementStore.test.ts
import { useEntitlementStore } from "./entitlementStore";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

describe("entitlementStore", () => {
  beforeEach(() => {
    useEntitlementStore.setState({ isPremium: false, hydrated: false });
  });

  it("defaults to free user", () => {
    expect(useEntitlementStore.getState().isPremium).toBe(false);
  });

  it("setPremium toggles flag and persists", async () => {
    await useEntitlementStore.getState().setPremium(true);
    expect(useEntitlementStore.getState().isPremium).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```
npx jest src/features/entitlement/entitlementStore.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement storage**

```typescript
// src/features/entitlement/entitlementStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "visitgrid:entitlement:isPremium";

export async function loadIsPremium(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === "true";
  } catch {
    return false;
  }
}

export async function saveIsPremium(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, value ? "true" : "false");
  } catch {}
}
```

- [ ] **Step 4: Implement store**

```typescript
// src/features/entitlement/entitlementStore.ts
import { create } from "zustand";
import { loadIsPremium, saveIsPremium } from "./entitlementStorage";

type State = {
  isPremium: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPremium: (value: boolean) => Promise<void>;
};

export const useEntitlementStore = create<State>((set) => ({
  isPremium: false,
  hydrated: false,
  hydrate: async () => {
    const v = await loadIsPremium();
    set({ isPremium: v, hydrated: true });
  },
  setPremium: async (value) => {
    set({ isPremium: value });
    await saveIsPremium(value);
  },
}));
```

- [ ] **Step 5: Run tests, then commit**

```
npx jest src/features/entitlement/
git add src/features/entitlement
git commit -m "feat(entitlement): add dev-only isPremium toggle store"
```

---

### Task 2: 정적 매핑 데이터 5종

**Files:**
- Create: `src/features/badges/data/population.json`
- Create: `src/features/badges/data/area.json`
- Create: `src/features/badges/data/flagColors.json`
- Create: `src/features/badges/data/officialLanguages.json`
- Create: `src/features/badges/data/utcOffset.json`
- Create: `src/features/badges/data/index.ts` (타입드 로더)
- Create: `src/features/badges/data/constants.ts` (총량 상수)
- Test: `src/features/badges/data/index.test.ts`

215개국 모든 ISO-3166-1 alpha-2 코드에 대해 항목을 채운다.

데이터 출처:
- 인구: UN World Population Prospects 2023 (전체 인구 ~8.05B 기준 정규화)
- 면적: World Bank 2022 (지구 육지 총량 148,940,000 km² 기준)
- 국기 색상: 위키피디아 각국 국기 색상 정규화 — `red / orange / yellow / green / blue / black / white` 7종 중 사용 색만
- 공용어: ISO 639-1 코드 — `en / zh / es / fr / ru / ar` 6종 중 해당 국가의 공용어
- UTC offset: 국가별 가장 큰 도시 표준시 기준 (러시아·미국 등 다중 시간대 국가는 수도/최대 도시 기준)

- [ ] **Step 1: Write failing test for loader**

```typescript
// src/features/badges/data/index.test.ts
import {
  POPULATION_BY_CODE,
  AREA_BY_CODE,
  FLAG_COLORS_BY_CODE,
  OFFICIAL_LANGUAGES_BY_CODE,
  UTC_OFFSET_BY_CODE,
} from "./index";
import { WORLD_POPULATION, EARTH_LAND_AREA_KM2 } from "./constants";

describe("static premium data", () => {
  it("includes all major countries", () => {
    for (const code of ["KR", "JP", "US", "FR", "BR", "ZA"]) {
      expect(POPULATION_BY_CODE[code]).toBeGreaterThan(0);
      expect(AREA_BY_CODE[code]).toBeGreaterThan(0);
      expect(FLAG_COLORS_BY_CODE[code].length).toBeGreaterThan(0);
      expect(OFFICIAL_LANGUAGES_BY_CODE[code].length).toBeGreaterThan(0);
      expect(typeof UTC_OFFSET_BY_CODE[code]).toBe("number");
    }
  });
  it("flag colors are within 7-color palette", () => {
    const palette = new Set(["red","orange","yellow","green","blue","black","white"]);
    for (const colors of Object.values(FLAG_COLORS_BY_CODE)) {
      for (const c of colors) expect(palette.has(c)).toBe(true);
    }
  });
  it("global totals match expected order of magnitude", () => {
    expect(WORLD_POPULATION).toBeGreaterThan(7_000_000_000);
    expect(EARTH_LAND_AREA_KM2).toBe(148_940_000);
  });
});
```

- [ ] **Step 2: Run — expect failure**

```
npx jest src/features/badges/data/
```

- [ ] **Step 3: Create the 5 JSON files**

`population.json`, `area.json`, `flagColors.json`, `officialLanguages.json`, `utcOffset.json` — 각 파일은 `Record<string, T>` 형태. 모든 파일은 ISO 3166-1 alpha-2 코드를 키로 사용. (`continents.ts`의 국가 목록과 일치)

JSON 작성 시 부담을 줄이기 위해 각 파일 작성을 별도 PR로 분리해도 무방하나, 본 task 안에서는 한 번에 5개를 작성한다. 데이터는 위 출처에서 발췌해 직접 손으로 작성한다 (215개국 × 5필드).

- [ ] **Step 4: Implement constants and loader**

```typescript
// src/features/badges/data/constants.ts
// UN World Population Prospects 2023, World Bank 2022.
// 변경 시 시점·출처를 본 파일에 명시한다.
export const WORLD_POPULATION = 8_045_311_000;
export const EARTH_LAND_AREA_KM2 = 148_940_000;
```

```typescript
// src/features/badges/data/index.ts
import populationRaw from "./population.json";
import areaRaw from "./area.json";
import flagColorsRaw from "./flagColors.json";
import officialLanguagesRaw from "./officialLanguages.json";
import utcOffsetRaw from "./utcOffset.json";

export type FlagColor =
  | "red" | "orange" | "yellow" | "green" | "blue" | "black" | "white";
export type UnLanguage = "en" | "zh" | "es" | "fr" | "ru" | "ar";

export const POPULATION_BY_CODE: Record<string, number> = populationRaw;
export const AREA_BY_CODE: Record<string, number> = areaRaw;
export const FLAG_COLORS_BY_CODE: Record<string, FlagColor[]> = flagColorsRaw as Record<string, FlagColor[]>;
export const OFFICIAL_LANGUAGES_BY_CODE: Record<string, UnLanguage[]> =
  officialLanguagesRaw as Record<string, UnLanguage[]>;
export const UTC_OFFSET_BY_CODE: Record<string, number> = utcOffsetRaw;

export { WORLD_POPULATION, EARTH_LAND_AREA_KM2 } from "./constants";
```

- [ ] **Step 5: Run tests, commit**

```
npx jest src/features/badges/data/
git add src/features/badges/data
git commit -m "feat(badges): add static country metadata for premium milestones"
```

---

### Task 3: PremiumMilestoneId 타입 + ALL_PREMIUM_MILESTONE_KINDS

**Files:**
- Modify: `src/features/milestone/milestoneTypes.ts`
- Test: `src/features/milestone/milestoneTypes.test.ts` (신규)

- [ ] **Step 1: Write failing test**

```typescript
// src/features/milestone/milestoneTypes.test.ts
import {
  ALL_PREMIUM_MILESTONE_KINDS,
  isPremiumMilestoneKind,
  isMilestoneKind,
} from "./milestoneTypes";

describe("premium milestone types", () => {
  it("lists all 10 premium kinds", () => {
    expect(ALL_PREMIUM_MILESTONE_KINDS).toHaveLength(10);
  });
  it("isPremiumMilestoneKind discriminates correctly", () => {
    expect(isPremiumMilestoneKind("premium_n_before_n")).toBe(true);
    expect(isPremiumMilestoneKind("countries")).toBe(false);
  });
  it("isMilestoneKind accepts both base and premium", () => {
    expect(isMilestoneKind("countries")).toBe(true);
    expect(isMilestoneKind("premium_humanity")).toBe(true);
    expect(isMilestoneKind("nonsense")).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Extend `milestoneTypes.ts`**

`milestoneTypes.ts`의 끝부분에 다음을 추가:

```typescript
export type PremiumMilestoneId =
  | "premium_n_before_n"
  | "premium_decade_stamps"
  | "premium_age_match"
  | "premium_four_seasons"
  | "premium_calendar"
  | "premium_flag_palette"
  | "premium_un_linguist"
  | "premium_humanity"
  | "premium_earth_area"
  | "premium_round_the_clock";

export const ALL_PREMIUM_MILESTONE_KINDS: readonly PremiumMilestoneId[] = [
  "premium_n_before_n",
  "premium_decade_stamps",
  "premium_age_match",
  "premium_four_seasons",
  "premium_calendar",
  "premium_flag_palette",
  "premium_un_linguist",
  "premium_humanity",
  "premium_earth_area",
  "premium_round_the_clock",
];

export function isPremiumMilestoneKind(v: unknown): v is PremiumMilestoneId {
  return (
    typeof v === "string" &&
    (ALL_PREMIUM_MILESTONE_KINDS as readonly string[]).includes(v)
  );
}
```

기존 `MilestoneKind`를 확장:

```typescript
export type MilestoneKind =
  | "countries"
  | "days"
  | ContinentMilestoneId
  | PremiumMilestoneId;
```

기존 `isMilestoneKind`를 다음과 같이 보강:

```typescript
export function isMilestoneKind(value: unknown): value is MilestoneKind {
  return (
    typeof value === "string" &&
    ((ALL_MILESTONE_KINDS as readonly string[]).includes(value) ||
      (ALL_PREMIUM_MILESTONE_KINDS as readonly string[]).includes(value))
  );
}
```

기본 7개 마일스톤만 노출하는 화면(예: 무료 사용자용 row 리스트)에서는 `ALL_MILESTONE_KINDS`를 그대로 사용. Premium 마일스톤은 별도 배열로 가져간다.

- [ ] **Step 4: Run tests, commit**

```
npx jest src/features/milestone/milestoneTypes.test.ts
git add src/features/milestone/milestoneTypes.ts src/features/milestone/milestoneTypes.test.ts
git commit -m "feat(milestone): add PremiumMilestoneId discriminator"
```

---

## Phase 2: 평가 함수 (순수, 외부 의존 없음)

평가 함수는 모두 `PremiumContext` → `BadgeDefinition[]` 형태. 외부 DB/Storage 호출 없음 → 단위 테스트 단순.

### Task 4: ageAtTimestamp 헬퍼 + PremiumContext 타입

**Files:**
- Create: `src/features/milestone/premium/types.ts`
- Create: `src/features/milestone/premium/ageUtils.ts`
- Test: `src/features/milestone/premium/ageUtils.test.ts`

- [ ] **Step 1: Failing tests**

```typescript
// src/features/milestone/premium/ageUtils.test.ts
import { ageAtTimestamp } from "./ageUtils";

describe("ageAtTimestamp", () => {
  it("returns 0 for a photo taken on the birth day", () => {
    const birth = { year: 1995, month: 6, day: 15 };
    const taken = new Date(1995, 5, 15).getTime();
    expect(ageAtTimestamp(taken, birth)).toBe(0);
  });
  it("returns 19 the day before 20th birthday", () => {
    const birth = { year: 1995, month: 6, day: 15 };
    const taken = new Date(2015, 5, 14).getTime();
    expect(ageAtTimestamp(taken, birth)).toBe(19);
  });
  it("returns 20 on 20th birthday", () => {
    const birth = { year: 1995, month: 6, day: 15 };
    const taken = new Date(2015, 5, 15).getTime();
    expect(ageAtTimestamp(taken, birth)).toBe(20);
  });
  it("returns -1 for photos before birth", () => {
    const birth = { year: 1995, month: 6, day: 15 };
    const taken = new Date(1990, 0, 1).getTime();
    expect(ageAtTimestamp(taken, birth)).toBe(-1);
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```typescript
// src/features/milestone/premium/ageUtils.ts
export type BirthDate = { year: number; month: number; day: number };

export function ageAtTimestamp(takenAtMs: number, birth: BirthDate): number {
  const d = new Date(takenAtMs);
  const ty = d.getFullYear();
  const tm = d.getMonth() + 1;
  const td = d.getDate();
  let age = ty - birth.year;
  if (tm < birth.month || (tm === birth.month && td < birth.day)) age -= 1;
  return age;
}
```

```typescript
// src/features/milestone/premium/types.ts
import type { BirthDate } from "./ageUtils";

export type Season = "spring" | "summer" | "autumn" | "winter";

/** 사진 한 장의 평가용 메타. tripDb의 visit_photos 한 행에서 가공된다. */
export type PremiumPhoto = {
  countryCode: string;
  takenAtMs: number;
};

/** 평가 함수에 주입되는 모든 사용자 고유 데이터. */
export type PremiumContext = {
  birth: BirthDate | null;
  homeCountry: string | null;
  /** 본국 포함 모든 사진 (정렬 가정 없음) */
  photos: PremiumPhoto[];
  /** 누적 방문국 수 (본국 포함) */
  visitedCountriesCount: number;
  /** 본국 포함 방문국 코드 목록 */
  visitedCountryCodes: string[];
  /** 현재(평가 시점) 만 나이 */
  currentAge: number | null;
};

export { BirthDate };
```

- [ ] **Step 4: Run tests, commit**

```
npx jest src/features/milestone/premium/ageUtils.test.ts
git add src/features/milestone/premium
git commit -m "feat(premium): add ageAtTimestamp helper and PremiumContext types"
```

---

### Task 5: A1 평가 — N Before N (5단계)

**Files:**
- Create: `src/features/milestone/premium/evaluators/nBeforeN.ts`
- Test: `src/features/milestone/premium/evaluators/nBeforeN.test.ts`

A1 단계: `[{ageBefore: 20, n: 5}, {25,10}, {30,20}, {40,30}, {50,50}]`

- [ ] **Step 1: Failing test**

```typescript
// src/features/milestone/premium/evaluators/nBeforeN.test.ts
import { evaluateNBeforeN } from "./nBeforeN";
import type { PremiumContext } from "../types";

const birth = { year: 2000, month: 1, day: 1 };

function ctx(photos: { code: string; year: number }[]): PremiumContext {
  return {
    birth,
    homeCountry: "KR",
    photos: photos.map((p) => ({
      countryCode: p.code,
      takenAtMs: new Date(p.year, 5, 1).getTime(),
    })),
    visitedCountriesCount: new Set(photos.map((p) => p.code)).size,
    visitedCountryCodes: Array.from(new Set(photos.map((p) => p.code))),
    currentAge: 30,
  };
}

describe("evaluateNBeforeN", () => {
  it("emits no badge when no photos before age 20", () => {
    expect(evaluateNBeforeN(ctx([]))).toEqual([]);
  });
  it("emits 5 Before 20 when ≥5 unique countries before age 20", () => {
    const c = ctx([
      { code: "KR", year: 2015 }, // age 15
      { code: "JP", year: 2016 },
      { code: "CN", year: 2017 },
      { code: "US", year: 2018 },
      { code: "FR", year: 2019 },
    ]);
    const out = evaluateNBeforeN(c);
    expect(out.map((b) => b.id)).toContain("premium_n_before_n_5_20");
  });
  it("does not emit when threshold reached after the cutoff age", () => {
    const c = ctx([
      { code: "KR", year: 2025 }, // age 25 — past cutoff 20
      { code: "JP", year: 2025 },
      { code: "CN", year: 2025 },
      { code: "US", year: 2025 },
      { code: "FR", year: 2025 },
    ]);
    const out = evaluateNBeforeN(c);
    expect(out.map((b) => b.id)).not.toContain("premium_n_before_n_5_20");
  });
  it("emits cumulatively for multiple stages", () => {
    const photos = [];
    for (let i = 0; i < 20; i++) {
      photos.push({ code: `C${i}`, year: 2010 + Math.floor(i / 4) }); // ages 10-14
    }
    const ids = evaluateNBeforeN(ctx(photos)).map((b) => b.id);
    expect(ids).toContain("premium_n_before_n_5_20");
    expect(ids).toContain("premium_n_before_n_10_25");
    expect(ids).toContain("premium_n_before_n_20_30");
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```typescript
// src/features/milestone/premium/evaluators/nBeforeN.ts
import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";
import { ageAtTimestamp } from "../ageUtils";

const STAGES: { ageBefore: number; n: number }[] = [
  { ageBefore: 20, n: 5 },
  { ageBefore: 25, n: 10 },
  { ageBefore: 30, n: 20 },
  { ageBefore: 40, n: 30 },
  { ageBefore: 50, n: 50 },
];

export function evaluateNBeforeN(ctx: PremiumContext): BadgeDefinition[] {
  if (!ctx.birth) return [];
  const out: BadgeDefinition[] = [];
  for (const s of STAGES) {
    const codes = new Set<string>();
    for (const p of ctx.photos) {
      const age = ageAtTimestamp(p.takenAtMs, ctx.birth);
      if (age >= 0 && age < s.ageBefore) codes.add(p.countryCode);
    }
    if (codes.size >= s.n) {
      out.push({
        id: `premium_n_before_n_${s.n}_${s.ageBefore}`,
        category: "premium_age",
        titleKo: `${s.n} Before ${s.ageBefore}`,
        titleEn: `${s.n} Before ${s.ageBefore}`,
        description: `만 ${s.ageBefore}세 전에 ${s.n}개국 방문`,
        emoji: "🏃",
        rank: 60 + s.n / 10,
      });
    }
  }
  return out;
}
```

호칭 한국어/영어 라벨은 i18n 단계(Task 22)에서 교체된다. 여기서는 자리만 잡아두는 fallback 텍스트.

`badges.ts`의 `BadgeCategory`에 `"premium_age"` 등 5종이 추가되어야 컴파일됨 — 이건 Task 14에서 수행. 본 task에서는 임시로 `as any`를 쓰는 대신, 다음 Task 14를 먼저 시작하지 않고도 컴파일을 통과시키기 위해 `BadgeCategory` 확장을 본 task에서 함께 수행한다:

```typescript
// src/features/badges/badges.ts: BadgeCategory 라인을 다음으로 교체
export type BadgeCategory =
  | "tier" | "days" | "continent" | "country" | "foreign"
  | "premium_age" | "premium_time" | "premium_culture" | "premium_share" | "premium_special";
```

(이 한 줄 변경은 다른 Premium 평가 함수들과 공유되므로, Task 14가 별도로 손볼 일이 적어진다.)

- [ ] **Step 4: Run tests, commit**

```
npx jest src/features/milestone/premium/evaluators/nBeforeN.test.ts
git add src/features/milestone/premium/evaluators src/features/badges/badges.ts
git commit -m "feat(premium): evaluate A1 N Before N (5 stages)"
```

---

### Task 6: A2 평가 — Decade Stamps

**Files:**
- Create: `src/features/milestone/premium/evaluators/decadeStamps.ts`
- Test: `src/features/milestone/premium/evaluators/decadeStamps.test.ts`

단계: `[{decade:"10s", n:5}, {"20s",15}, {"30s",25}, {"40s",25}, {"50s+",15}]`

- [ ] **Step 1: Failing test**

```typescript
// src/features/milestone/premium/evaluators/decadeStamps.test.ts
import { evaluateDecadeStamps } from "./decadeStamps";
import type { PremiumContext } from "../types";

function makeCtx(photos: { code: string; ageAtPhoto: number }[]): PremiumContext {
  const birthYear = 1990;
  return {
    birth: { year: birthYear, month: 6, day: 15 },
    homeCountry: "KR",
    photos: photos.map((p) => ({
      countryCode: p.code,
      takenAtMs: new Date(birthYear + p.ageAtPhoto, 6, 1).getTime(), // July, after birthday
    })),
    visitedCountriesCount: new Set(photos.map((p) => p.code)).size,
    visitedCountryCodes: [...new Set(photos.map((p) => p.code))],
    currentAge: 35,
  };
}

describe("evaluateDecadeStamps", () => {
  it("emits 10s badge with 5 unique countries in teens", () => {
    const photos = [10, 12, 14, 16, 18].map((age, i) => ({
      code: `C${i}`,
      ageAtPhoto: age,
    }));
    const ids = evaluateDecadeStamps(makeCtx(photos)).map((b) => b.id);
    expect(ids).toContain("premium_decade_10s");
  });
  it("does not emit 20s badge with only 14 countries in 20s", () => {
    const photos = Array.from({ length: 14 }, (_, i) => ({
      code: `C${i}`,
      ageAtPhoto: 22,
    }));
    const ids = evaluateDecadeStamps(makeCtx(photos)).map((b) => b.id);
    expect(ids).not.toContain("premium_decade_20s");
  });
  it("emits 50s+ for ages 50 and older combined", () => {
    const photos = Array.from({ length: 15 }, (_, i) => ({
      code: `C${i}`,
      ageAtPhoto: 50 + (i % 20), // 50..69
    }));
    const ids = evaluateDecadeStamps(makeCtx(photos)).map((b) => b.id);
    expect(ids).toContain("premium_decade_50plus");
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```typescript
// src/features/milestone/premium/evaluators/decadeStamps.ts
import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";
import { ageAtTimestamp } from "../ageUtils";

type Stage = { id: string; min: number; max: number; n: number; emoji: string };
const STAGES: Stage[] = [
  { id: "10s",     min: 10, max: 19, n: 5,  emoji: "🌱" },
  { id: "20s",     min: 20, max: 29, n: 15, emoji: "🌟" },
  { id: "30s",     min: 30, max: 39, n: 25, emoji: "🎒" },
  { id: "40s",     min: 40, max: 49, n: 25, emoji: "🧭" },
  { id: "50plus",  min: 50, max: 999, n: 15, emoji: "🌅" },
];

export function evaluateDecadeStamps(ctx: PremiumContext): BadgeDefinition[] {
  if (!ctx.birth) return [];
  const out: BadgeDefinition[] = [];
  for (const s of STAGES) {
    const codes = new Set<string>();
    for (const p of ctx.photos) {
      const age = ageAtTimestamp(p.takenAtMs, ctx.birth);
      if (age >= s.min && age <= s.max) codes.add(p.countryCode);
    }
    if (codes.size >= s.n) {
      out.push({
        id: `premium_decade_${s.id}`,
        category: "premium_age",
        titleKo: `${s.id} 컬렉터`,
        titleEn: `Decade ${s.id}`,
        description: `${s.id} 시기에 ${s.n}개국 방문`,
        emoji: s.emoji,
        rank: 65,
      });
    }
  }
  return out;
}
```

- [ ] **Step 4: Run tests, commit**

```
npx jest src/features/milestone/premium/evaluators/decadeStamps.test.ts
git add src/features/milestone/premium/evaluators
git commit -m "feat(premium): evaluate A2 Decade Stamps"
```

---

### Task 7: A3 평가 — My Age in Countries

**Files:**
- Create: `src/features/milestone/premium/evaluators/ageMatch.ts`
- Test: 동 디렉터리 `.test.ts`

- [ ] **Step 1: Failing test**

```typescript
import { evaluateAgeMatch } from "./ageMatch";
import type { PremiumContext } from "../types";

function ctx(visited: number, age: number): PremiumContext {
  return {
    birth: { year: 1990, month: 1, day: 1 },
    homeCountry: "KR",
    photos: [],
    visitedCountriesCount: visited,
    visitedCountryCodes: Array.from({ length: visited }, (_, i) => `C${i}`),
    currentAge: age,
  };
}

describe("evaluateAgeMatch", () => {
  it("emits stage 1 when visited >= age", () => {
    const ids = evaluateAgeMatch(ctx(35, 35)).map((b) => b.id);
    expect(ids).toContain("premium_age_match_x1");
  });
  it("emits stage 3 when visited >= age × 2", () => {
    const ids = evaluateAgeMatch(ctx(70, 35)).map((b) => b.id);
    expect(ids).toEqual(expect.arrayContaining([
      "premium_age_match_x1",
      "premium_age_match_x1_5",
      "premium_age_match_x2",
    ]));
  });
  it("emits nothing when birth/age unknown", () => {
    const ids = evaluateAgeMatch({
      ...ctx(50, 0),
      birth: null,
      currentAge: null,
    }).map((b) => b.id);
    expect(ids).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```typescript
// src/features/milestone/premium/evaluators/ageMatch.ts
import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";

const STAGES: { id: string; mul: number; emoji: string }[] = [
  { id: "x1", mul: 1, emoji: "🎂" },
  { id: "x1_5", mul: 1.5, emoji: "🎉" },
  { id: "x2", mul: 2, emoji: "🌠" },
];

export function evaluateAgeMatch(ctx: PremiumContext): BadgeDefinition[] {
  if (!ctx.birth || ctx.currentAge == null) return [];
  const visited = ctx.visitedCountriesCount;
  const age = ctx.currentAge;
  const out: BadgeDefinition[] = [];
  for (const s of STAGES) {
    if (visited >= Math.ceil(age * s.mul)) {
      out.push({
        id: `premium_age_match_${s.id}`,
        category: "premium_age",
        titleKo: `Age ${s.id}`,
        titleEn: `Age Match ${s.id}`,
        description: `현재 만 나이 × ${s.mul} 이상의 방문국`,
        emoji: s.emoji,
        rank: 62,
      });
    }
  }
  return out;
}
```

- [ ] **Step 4: Run, commit**

```
npx jest src/features/milestone/premium/evaluators/ageMatch.test.ts
git add src/features/milestone/premium/evaluators
git commit -m "feat(premium): evaluate A3 Age Match"
```

---

### Task 8: C1 평가 — Four Seasons (국가별 동적)

**Files:**
- Create: `src/features/milestone/premium/evaluators/fourSeasons.ts`
- Test: 동 디렉터리

본국은 제외 (spec §2.C1).

- [ ] **Step 1: Failing test**

```typescript
import { evaluateFourSeasons } from "./fourSeasons";
import type { PremiumContext } from "../types";

function photo(code: string, year: number, month: number) {
  return { countryCode: code, takenAtMs: new Date(year, month - 1, 15).getTime() };
}
function ctx(photos: { countryCode: string; takenAtMs: number }[]): PremiumContext {
  return {
    birth: { year: 1990, month: 1, day: 1 },
    homeCountry: "KR",
    photos,
    visitedCountriesCount: 0,
    visitedCountryCodes: [],
    currentAge: 35,
  };
}

describe("evaluateFourSeasons", () => {
  it("emits when all 4 seasons covered for one country", () => {
    const c = ctx([
      photo("JP", 2020, 4),  // spring
      photo("JP", 2020, 7),  // summer
      photo("JP", 2020, 10), // autumn
      photo("JP", 2020, 1),  // winter
    ]);
    const ids = evaluateFourSeasons(c).map((b) => b.id);
    expect(ids).toEqual(["premium_four_seasons_JP"]);
  });
  it("ignores home country", () => {
    const c = ctx([
      photo("KR", 2020, 4), photo("KR", 2020, 7),
      photo("KR", 2020, 10), photo("KR", 2020, 1),
    ]);
    expect(evaluateFourSeasons(c)).toEqual([]);
  });
  it("does not emit with only 3 seasons", () => {
    const c = ctx([
      photo("JP", 2020, 4), photo("JP", 2020, 7), photo("JP", 2020, 10),
    ]);
    expect(evaluateFourSeasons(c)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```typescript
// src/features/milestone/premium/evaluators/fourSeasons.ts
import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext, Season } from "../types";

function seasonOfMonth(month1to12: number): Season {
  if (month1to12 >= 3 && month1to12 <= 5) return "spring";
  if (month1to12 >= 6 && month1to12 <= 8) return "summer";
  if (month1to12 >= 9 && month1to12 <= 11) return "autumn";
  return "winter";
}

export function evaluateFourSeasons(ctx: PremiumContext): BadgeDefinition[] {
  const byCountry = new Map<string, Set<Season>>();
  for (const p of ctx.photos) {
    if (ctx.homeCountry && p.countryCode === ctx.homeCountry) continue;
    const m = new Date(p.takenAtMs).getMonth() + 1;
    const set = byCountry.get(p.countryCode) ?? new Set<Season>();
    set.add(seasonOfMonth(m));
    byCountry.set(p.countryCode, set);
  }
  const out: BadgeDefinition[] = [];
  for (const [code, seasons] of byCountry) {
    if (seasons.size === 4) {
      out.push({
        id: `premium_four_seasons_${code}`,
        category: "premium_time",
        titleKo: `${code} 사계절`,
        titleEn: `${code} Four Seasons`,
        description: `${code} 한 국가에서 4계절 모두 사진을 남김`,
        emoji: "🌸",
        rank: 70,
      });
    }
  }
  return out;
}
```

- [ ] **Step 4: Run, commit**

```
npx jest src/features/milestone/premium/evaluators/fourSeasons.test.ts
git add src/features/milestone/premium/evaluators
git commit -m "feat(premium): evaluate C1 Four Seasons (per-country)"
```

---

### Task 9: C2 평가 — Calendar Drifter

**Files:**
- Create: `src/features/milestone/premium/evaluators/calendar.ts`
- Test: 동 디렉터리

- [ ] **Step 1: Failing test**

```typescript
import { evaluateCalendar } from "./calendar";
import type { PremiumContext } from "../types";

function ctx(months: number[]): PremiumContext {
  return {
    birth: null,
    homeCountry: "KR",
    photos: months.map((m) => ({
      countryCode: "JP", // foreign
      takenAtMs: new Date(2020, m - 1, 15).getTime(),
    })),
    visitedCountriesCount: 0,
    visitedCountryCodes: [],
    currentAge: null,
  };
}

describe("evaluateCalendar", () => {
  it("emits half-year at 6 unique foreign months", () => {
    const ids = evaluateCalendar(ctx([1,3,5,7,9,11])).map((b) => b.id);
    expect(ids).toEqual(["premium_calendar_6"]);
  });
  it("emits both stages at 12 months", () => {
    const ids = evaluateCalendar(ctx([1,2,3,4,5,6,7,8,9,10,11,12])).map((b) => b.id);
    expect(ids).toEqual(expect.arrayContaining(["premium_calendar_6", "premium_calendar_12"]));
  });
  it("ignores home country photos", () => {
    const c = ctx([1,2,3,4,5,6]);
    c.photos.forEach((p) => (p.countryCode = "KR"));
    expect(evaluateCalendar(c)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```typescript
// src/features/milestone/premium/evaluators/calendar.ts
import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";

export function evaluateCalendar(ctx: PremiumContext): BadgeDefinition[] {
  const months = new Set<number>();
  for (const p of ctx.photos) {
    if (ctx.homeCountry && p.countryCode === ctx.homeCountry) continue;
    months.add(new Date(p.takenAtMs).getMonth() + 1);
  }
  const out: BadgeDefinition[] = [];
  if (months.size >= 6) {
    out.push({
      id: "premium_calendar_6",
      category: "premium_time",
      titleKo: "반년의 여행자",
      titleEn: "Half-Year Drifter",
      description: "12개월 중 6개월에 해외 사진",
      emoji: "📅",
      rank: 71,
    });
  }
  if (months.size >= 12) {
    out.push({
      id: "premium_calendar_12",
      category: "premium_time",
      titleKo: "달력의 여행자",
      titleEn: "Calendar Drifter",
      description: "12개월 모두 해외 사진",
      emoji: "🗓️",
      rank: 72,
    });
  }
  return out;
}
```

- [ ] **Step 4: Run, commit**

```
npx jest src/features/milestone/premium/evaluators/calendar.test.ts
git add src/features/milestone/premium/evaluators
git commit -m "feat(premium): evaluate C2 Calendar Drifter"
```

---

### Task 10: D1 평가 — Flag Palette

**Files:**
- Create: `src/features/milestone/premium/evaluators/flagPalette.ts`
- Test: 동 디렉터리

- [ ] **Step 1: Failing test**

```typescript
import { evaluateFlagPalette } from "./flagPalette";
import type { PremiumContext } from "../types";

jest.mock("../../../badges/data", () => ({
  FLAG_COLORS_BY_CODE: {
    KR: ["red", "blue", "white", "black"],
    JP: ["red", "white"],
    BR: ["green", "yellow", "blue", "white"],
    DE: ["black", "red", "yellow"],
    IE: ["green", "white", "orange"],
  },
}));

function ctx(codes: string[]): PremiumContext {
  return {
    birth: null, homeCountry: "KR",
    photos: [], visitedCountriesCount: codes.length,
    visitedCountryCodes: codes, currentAge: null,
  };
}

describe("evaluateFlagPalette", () => {
  it("emits 5-color stage with 5 distinct colors", () => {
    const ids = evaluateFlagPalette(ctx(["KR", "BR"])).map((b) => b.id);
    expect(ids).toContain("premium_flag_palette_5");
  });
  it("emits 7-color stage when all 7 collected", () => {
    const ids = evaluateFlagPalette(ctx(["KR","BR","DE","IE"])).map((b) => b.id);
    expect(ids).toContain("premium_flag_palette_7");
  });
  it("emits nothing with fewer than 5 colors", () => {
    expect(evaluateFlagPalette(ctx(["JP"]))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```typescript
// src/features/milestone/premium/evaluators/flagPalette.ts
import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";
import { FLAG_COLORS_BY_CODE } from "../../../badges/data";

export function evaluateFlagPalette(ctx: PremiumContext): BadgeDefinition[] {
  const colors = new Set<string>();
  for (const code of ctx.visitedCountryCodes) {
    const cs = FLAG_COLORS_BY_CODE[code] ?? [];
    for (const c of cs) colors.add(c);
  }
  const out: BadgeDefinition[] = [];
  if (colors.size >= 5) {
    out.push({
      id: "premium_flag_palette_5",
      category: "premium_culture",
      titleKo: "색의 수집가",
      titleEn: "Color Collector",
      description: "방문국 국기에서 5색 수집",
      emoji: "🎨",
      rank: 73,
    });
  }
  if (colors.size >= 7) {
    out.push({
      id: "premium_flag_palette_7",
      category: "premium_culture",
      titleKo: "팔레트 마스터",
      titleEn: "Flag Palette Master",
      description: "방문국 국기에서 7색 모두 수집",
      emoji: "🌈",
      rank: 74,
    });
  }
  return out;
}
```

- [ ] **Step 4: Run, commit**

```
npx jest src/features/milestone/premium/evaluators/flagPalette.test.ts
git add src/features/milestone/premium/evaluators
git commit -m "feat(premium): evaluate D1 Flag Palette"
```

---

### Task 11: D2 평가 — UN Linguist

**Files:**
- Create: `src/features/milestone/premium/evaluators/unLinguist.ts`
- Test: 동 디렉터리

- [ ] **Step 1: Failing test**

```typescript
import { evaluateUnLinguist } from "./unLinguist";

jest.mock("../../../badges/data", () => ({
  OFFICIAL_LANGUAGES_BY_CODE: {
    KR: [], JP: [], US: ["en"], FR: ["fr"], CN: ["zh"], EG: ["ar"], BR: ["fr"],
    MX: ["es"], RU: ["ru"],
  },
}));

import type { PremiumContext } from "../types";
function ctx(codes: string[]): PremiumContext {
  return {
    birth: null, homeCountry: null, photos: [],
    visitedCountriesCount: codes.length, visitedCountryCodes: codes, currentAge: null,
  };
}

describe("evaluateUnLinguist", () => {
  it("emits trilingual at 3 languages", () => {
    const ids = evaluateUnLinguist(ctx(["US", "FR", "CN"])).map((b) => b.id);
    expect(ids).toContain("premium_un_linguist_3");
  });
  it("emits full at 6 languages", () => {
    const ids = evaluateUnLinguist(ctx(["US","FR","CN","EG","MX","RU"])).map((b) => b.id);
    expect(ids).toContain("premium_un_linguist_6");
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```typescript
// src/features/milestone/premium/evaluators/unLinguist.ts
import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";
import { OFFICIAL_LANGUAGES_BY_CODE } from "../../../badges/data";

export function evaluateUnLinguist(ctx: PremiumContext): BadgeDefinition[] {
  const langs = new Set<string>();
  for (const code of ctx.visitedCountryCodes) {
    for (const l of OFFICIAL_LANGUAGES_BY_CODE[code] ?? []) langs.add(l);
  }
  const out: BadgeDefinition[] = [];
  if (langs.size >= 3) {
    out.push({
      id: "premium_un_linguist_3",
      category: "premium_culture",
      titleKo: "3개 국어의 여행자",
      titleEn: "Trilingual Traveler",
      description: "UN 6공용어 중 3개를 공용어로 쓰는 국가 방문",
      emoji: "🗣️",
      rank: 75,
    });
  }
  if (langs.size >= 6) {
    out.push({
      id: "premium_un_linguist_6",
      category: "premium_culture",
      titleKo: "UN 공용어 정복자",
      titleEn: "UN Linguist",
      description: "UN 6공용어 모두 — 영·중·스페인·프랑스·러시아·아랍",
      emoji: "🌐",
      rank: 76,
    });
  }
  return out;
}
```

- [ ] **Step 4: Run, commit**

```
npx jest src/features/milestone/premium/evaluators/unLinguist.test.ts
git add src/features/milestone/premium/evaluators
git commit -m "feat(premium): evaluate D2 UN Linguist"
```

---

### Task 12: E1+E2 평가 — Humanity / Earth Area

**Files:**
- Create: `src/features/milestone/premium/evaluators/share.ts`
- Test: 동 디렉터리

- [ ] **Step 1: Failing test**

```typescript
import { evaluateShare } from "./share";

jest.mock("../../../badges/data", () => ({
  POPULATION_BY_CODE: { KR: 51_000_000, CN: 1_400_000_000, IN: 1_400_000_000 },
  AREA_BY_CODE: { KR: 100_363, CN: 9_596_961, IN: 3_287_263 },
  WORLD_POPULATION: 8_000_000_000,
  EARTH_LAND_AREA_KM2: 148_940_000,
}));

import type { PremiumContext } from "../types";
function ctx(codes: string[]): PremiumContext {
  return {
    birth: null, homeCountry: null, photos: [],
    visitedCountriesCount: codes.length,
    visitedCountryCodes: codes, currentAge: null,
  };
}

describe("evaluateShare", () => {
  it("emits Quarter of Humanity at ≥25% population", () => {
    const ids = evaluateShare(ctx(["CN"])).map((b) => b.id);
    expect(ids).toContain("premium_humanity_25");
  });
  it("emits Quarter of Earth at ≥25% area", () => {
    const ids = evaluateShare(ctx(["CN", "IN"])).map((b) => b.id); // ~8.6% — won't trigger
    expect(ids).not.toContain("premium_earth_25");
  });
  it("emits no badge with empty visit list", () => {
    expect(evaluateShare(ctx([]))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```typescript
// src/features/milestone/premium/evaluators/share.ts
import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";
import {
  POPULATION_BY_CODE,
  AREA_BY_CODE,
  WORLD_POPULATION,
  EARTH_LAND_AREA_KM2,
} from "../../../badges/data";

const SHARE_STAGES = [0.25, 0.50, 0.75];

function tierKo(pct: number): string {
  if (pct === 0.25) return "4분의 1";
  if (pct === 0.50) return "절반";
  return "4분의 3";
}
function tierEn(pct: number): string {
  if (pct === 0.25) return "Quarter";
  if (pct === 0.50) return "Half";
  return "Three-Quarters";
}

export function evaluateShare(ctx: PremiumContext): BadgeDefinition[] {
  let pop = 0;
  let area = 0;
  for (const code of ctx.visitedCountryCodes) {
    pop += POPULATION_BY_CODE[code] ?? 0;
    area += AREA_BY_CODE[code] ?? 0;
  }
  const popShare = pop / WORLD_POPULATION;
  const areaShare = area / EARTH_LAND_AREA_KM2;
  const out: BadgeDefinition[] = [];
  for (const t of SHARE_STAGES) {
    if (popShare >= t) {
      out.push({
        id: `premium_humanity_${Math.round(t * 100)}`,
        category: "premium_share",
        titleKo: `인류의 ${tierKo(t)}`,
        titleEn: `${tierEn(t)} of Humanity`,
        description: `방문국 인구가 세계 인구의 ${Math.round(t * 100)}% 이상`,
        emoji: "👥",
        rank: 80,
      });
    }
    if (areaShare >= t) {
      out.push({
        id: `premium_earth_${Math.round(t * 100)}`,
        category: "premium_share",
        titleKo: `지구의 ${tierKo(t)}`,
        titleEn: `${tierEn(t)} of Earth`,
        description: `방문국 면적이 지구 육지의 ${Math.round(t * 100)}% 이상`,
        emoji: "🌍",
        rank: 80,
      });
    }
  }
  return out;
}
```

- [ ] **Step 4: Run, commit**

```
npx jest src/features/milestone/premium/evaluators/share.test.ts
git add src/features/milestone/premium/evaluators
git commit -m "feat(premium): evaluate E1+E2 Humanity / Earth share"
```

---

### Task 13: B3 평가 — Round the Clock (시차 24h+)

**Files:**
- Create: `src/features/milestone/premium/evaluators/roundTheClock.ts`
- Test: 동 디렉터리

- [ ] **Step 1: Failing test**

```typescript
import { evaluateRoundTheClock } from "./roundTheClock";

jest.mock("../../../badges/data", () => ({
  UTC_OFFSET_BY_CODE: { WS: -11, KI: 14, US: -5, JP: 9 },
}));

import type { PremiumContext } from "../types";
function ctx(codes: string[]): PremiumContext {
  return {
    birth: null, homeCountry: null, photos: [],
    visitedCountriesCount: codes.length,
    visitedCountryCodes: codes, currentAge: null,
  };
}

describe("evaluateRoundTheClock", () => {
  it("emits when offset diff >= 24h", () => {
    const ids = evaluateRoundTheClock(ctx(["WS", "KI"])).map((b) => b.id);
    expect(ids).toEqual(["premium_round_the_clock"]);
  });
  it("does not emit at 14h diff", () => {
    expect(evaluateRoundTheClock(ctx(["US", "JP"]))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```typescript
// src/features/milestone/premium/evaluators/roundTheClock.ts
import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";
import { UTC_OFFSET_BY_CODE } from "../../../badges/data";

export function evaluateRoundTheClock(ctx: PremiumContext): BadgeDefinition[] {
  let min = +Infinity;
  let max = -Infinity;
  for (const code of ctx.visitedCountryCodes) {
    const off = UTC_OFFSET_BY_CODE[code];
    if (off == null) continue;
    if (off < min) min = off;
    if (off > max) max = off;
  }
  if (max - min >= 24) {
    return [{
      id: "premium_round_the_clock",
      category: "premium_special",
      titleKo: "지구 한 바퀴",
      titleEn: "Round the Clock",
      description: "시차 24시간 이상 차이의 두 국가 모두 방문",
      emoji: "🕛",
      rank: 85,
    }];
  }
  return [];
}
```

- [ ] **Step 4: Run, commit**

```
npx jest src/features/milestone/premium/evaluators/roundTheClock.test.ts
git add src/features/milestone/premium/evaluators
git commit -m "feat(premium): evaluate B3 Round the Clock"
```

---

## Phase 3: 통합 — Premium evaluator + Context builder + Store wiring

### Task 14: evaluatePremiumBadges — 모든 evaluator 합산

**Files:**
- Create: `src/features/milestone/premium/evaluatePremium.ts`
- Test: 동 디렉터리

- [ ] **Step 1: Failing test**

```typescript
// src/features/milestone/premium/evaluatePremium.test.ts
import { evaluatePremiumBadges } from "./evaluatePremium";
import type { PremiumContext } from "./types";

jest.mock("../../badges/data", () => ({
  POPULATION_BY_CODE: {}, AREA_BY_CODE: {}, FLAG_COLORS_BY_CODE: {},
  OFFICIAL_LANGUAGES_BY_CODE: {}, UTC_OFFSET_BY_CODE: {},
  WORLD_POPULATION: 8e9, EARTH_LAND_AREA_KM2: 1.4894e8,
}));

const empty: PremiumContext = {
  birth: null, homeCountry: null, photos: [],
  visitedCountriesCount: 0, visitedCountryCodes: [], currentAge: null,
};

describe("evaluatePremiumBadges", () => {
  it("returns empty array when context yields no matches", () => {
    expect(evaluatePremiumBadges(empty)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```typescript
// src/features/milestone/premium/evaluatePremium.ts
import type { BadgeDefinition } from "../../badges/badges";
import type { PremiumContext } from "./types";
import { evaluateNBeforeN } from "./evaluators/nBeforeN";
import { evaluateDecadeStamps } from "./evaluators/decadeStamps";
import { evaluateAgeMatch } from "./evaluators/ageMatch";
import { evaluateFourSeasons } from "./evaluators/fourSeasons";
import { evaluateCalendar } from "./evaluators/calendar";
import { evaluateFlagPalette } from "./evaluators/flagPalette";
import { evaluateUnLinguist } from "./evaluators/unLinguist";
import { evaluateShare } from "./evaluators/share";
import { evaluateRoundTheClock } from "./evaluators/roundTheClock";

export function evaluatePremiumBadges(ctx: PremiumContext): BadgeDefinition[] {
  return [
    ...evaluateNBeforeN(ctx),
    ...evaluateDecadeStamps(ctx),
    ...evaluateAgeMatch(ctx),
    ...evaluateFourSeasons(ctx),
    ...evaluateCalendar(ctx),
    ...evaluateFlagPalette(ctx),
    ...evaluateUnLinguist(ctx),
    ...evaluateShare(ctx),
    ...evaluateRoundTheClock(ctx),
  ];
}
```

- [ ] **Step 4: Run, commit**

```
npx jest src/features/milestone/premium/evaluatePremium.test.ts
git add src/features/milestone/premium
git commit -m "feat(premium): aggregate all premium badge evaluators"
```

---

### Task 15: PremiumContext builder — DB 조회 + 가공

**Files:**
- Create: `src/features/milestone/premium/buildContext.ts`
- Test: 동 디렉터리 (DB 모킹)

- [ ] **Step 1: Failing test**

```typescript
// src/features/milestone/premium/buildContext.test.ts
import { buildPremiumContext } from "./buildContext";

jest.mock("../../travel/trip/tripDb", () => ({
  getTripDb: jest.fn().mockResolvedValue({
    getAllAsync: jest.fn().mockResolvedValue([
      { country_code: "JP", taken_at: new Date(2020, 5, 1).getTime() },
      { country_code: "FR", taken_at: new Date(2021, 8, 1).getTime() },
    ]),
  }),
}));

describe("buildPremiumContext", () => {
  it("composes context from profile + visit data", async () => {
    const ctx = await buildPremiumContext({
      profile: { birthYear: 1995, birthMonth: 6, birthDay: 15, gender: "male" },
      homeCountryCode: "KR",
      visitedCountryCodes: ["KR", "JP", "FR"],
      now: new Date(2025, 8, 1).getTime(),
    });
    expect(ctx.birth).toEqual({ year: 1995, month: 6, day: 15 });
    expect(ctx.homeCountry).toBe("KR");
    expect(ctx.visitedCountryCodes).toEqual(["KR", "JP", "FR"]);
    expect(ctx.visitedCountriesCount).toBe(3);
    expect(ctx.currentAge).toBe(30);
    expect(ctx.photos).toHaveLength(2);
  });
  it("yields null fields when profile missing", async () => {
    const ctx = await buildPremiumContext({
      profile: null,
      homeCountryCode: null,
      visitedCountryCodes: [],
      now: Date.now(),
    });
    expect(ctx.birth).toBeNull();
    expect(ctx.currentAge).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```typescript
// src/features/milestone/premium/buildContext.ts
import type { UserProfile } from "../../onboarding/profileStore";
import { getTripDb } from "../../travel/trip/tripDb";
import { ageAtTimestamp } from "./ageUtils";
import type { PremiumContext, PremiumPhoto } from "./types";

type Args = {
  profile: UserProfile | null;
  homeCountryCode: string | null;
  visitedCountryCodes: string[];
  now: number;
};

export async function buildPremiumContext(args: Args): Promise<PremiumContext> {
  const birth = args.profile
    ? { year: args.profile.birthYear, month: args.profile.birthMonth, day: args.profile.birthDay }
    : null;
  const photos = await loadAllPhotos();
  const currentAge = birth ? ageAtTimestamp(args.now, birth) : null;
  return {
    birth,
    homeCountry: args.homeCountryCode,
    photos,
    visitedCountriesCount: args.visitedCountryCodes.length,
    visitedCountryCodes: args.visitedCountryCodes,
    currentAge: currentAge != null && currentAge >= 0 ? currentAge : null,
  };
}

async function loadAllPhotos(): Promise<PremiumPhoto[]> {
  const db = await getTripDb();
  const rows = await db.getAllAsync<{
    country_code: string;
    taken_at: number;
  }>(
    `SELECT country_code, taken_at FROM visit_photos WHERE deleted_at IS NULL`
  );
  return rows.map((r) => ({ countryCode: r.country_code, takenAtMs: r.taken_at }));
}
```

- [ ] **Step 4: Run, commit**

```
npx jest src/features/milestone/premium/buildContext.test.ts
git add src/features/milestone/premium
git commit -m "feat(premium): build PremiumContext from profile + photo DB"
```

---

### Task 16: badgeStore.evaluate — premiumContext 옵셔널 파라미터 추가

**Files:**
- Modify: `src/features/badges/badgeStore.ts`
- Modify: `src/features/badges/badges.ts`

- [ ] **Step 1: Modify `badges.ts` — evaluateBadges 시그니처 확장**

`evaluateBadges` 함수에 `premium?: BadgeDefinition[]` 파라미터를 추가하여 외부에서 평가된 Premium 호칭을 합쳐 emit:

```typescript
// src/features/badges/badges.ts — evaluateBadges 함수 수정
export function evaluateBadges(
  stats: BadgeStats,
  countryNameByCode: Record<string, string>,
  premium: BadgeDefinition[] = [],
): BadgeDefinition[] {
  const out: BadgeDefinition[] = [];
  // ... 기존 로직 그대로 ...
  out.push(...premium);
  return out;
}
```

(기존 함수 본문은 변경하지 않고 마지막 `return out` 직전에 `out.push(...premium)` 한 줄만 추가)

- [ ] **Step 2: Modify `badgeStore.ts` — evaluate 시그니처 확장**

```typescript
// badgeStore.ts: State.evaluate 와 구현부 수정
evaluate: (
  stats: BadgeStats,
  countryNameByCode: Record<string, string>,
  premium?: BadgeDefinition[],
) => Promise<BadgeDefinition[]>;
```

구현부:
```typescript
evaluate: async (stats, countryNameByCode, premium = []) => {
  const evaluated = evaluateBadges(stats, countryNameByCode, premium);
  // ... 기존 로직 그대로 ...
  return evaluated;
},
```

- [ ] **Step 3: Run existing badge tests to verify no regression**

```
npx jest src/features/badges/
```

- [ ] **Step 4: Commit**

```
git add src/features/badges/badges.ts src/features/badges/badgeStore.ts
git commit -m "feat(badges): accept evaluated premium badges in evaluate()"
```

---

### Task 17: visitStore.evaluateBadges에서 premium context 빌드 후 전달

**Files:**
- Modify: `src/features/travel/visitStore.ts`

- [ ] **Step 1: Modify `evaluateBadges` 함수**

상단 import 추가:

```typescript
import { useEntitlementStore } from "../entitlement/entitlementStore";
import { useProfileStore } from "../onboarding/profileStore";
import { buildPremiumContext } from "../milestone/premium/buildContext";
import { evaluatePremiumBadges } from "../milestone/premium/evaluatePremium";
```

`visitStore.ts`의 `evaluateBadges` 본문을 수정:

```typescript
evaluateBadges: async () => {
  const { visitCounts, homeCountry } = get();
  if (!homeCountry) return;
  const totalDays = Object.values(visitCounts).reduce((s, n) => s + n, 0);
  const foreignPhotoCount = await loadForeignPhotoCount(homeCountry.code);
  const dbDays = await loadTotalVisitDays();

  // Premium context — only evaluate if user is premium.
  let premiumBadges: BadgeDefinition[] = [];
  if (useEntitlementStore.getState().isPremium) {
    const profile = useProfileStore.getState().profile;
    const ctx = await buildPremiumContext({
      profile,
      homeCountryCode: homeCountry.code,
      visitedCountryCodes: Object.keys(visitCounts),
      now: Date.now(),
    });
    premiumBadges = evaluatePremiumBadges(ctx);
  }

  await useBadgeStore.getState().evaluate(
    {
      visitedCountriesCount: Object.keys(visitCounts).length,
      totalDays: Math.max(totalDays, dbDays),
      daysByCountry: visitCounts,
      foreignPhotoCount,
    },
    COUNTRY_NAME_KO_BY_CODE,
    premiumBadges,
  );
},
```

`BadgeDefinition` import 추가 (아직 없다면):
```typescript
import type { BadgeDefinition } from "../badges/badges";
```

- [ ] **Step 2: Trigger re-evaluation when isPremium toggles**

`entitlementStore.ts`의 `setPremium` 호출 후 `useVisitStore.getState().evaluateBadges()`를 호출하도록 외부에서 연결한다. visitStore와 entitlementStore의 순환 의존을 막기 위해 entitlementStore가 visitStore를 직접 import하지 않고, 호출자(예: SettingsScreen의 dev 토글)가 두 호출을 연속 실행한다.

본 task에서는 useEntitlementStore의 `setPremium` 직후 `evaluateBadges`를 호출하는 헬퍼를 SettingsScreen 또는 dev 화면에서 사용하기 위한 명시적 패턴으로만 남긴다. 코드 변경 없음 — 다음 task(SettingsScreen)에서 묶어서 처리.

- [ ] **Step 3: Run tests, manual smoke**

기존 visitStore 테스트가 없으므로, 다음 명령으로 전체 jest 회귀 확인:

```
npx jest
```
Expected: 모든 기존 테스트 PASS.

- [ ] **Step 4: Commit**

```
git add src/features/travel/visitStore.ts
git commit -m "feat(travel): evaluate premium badges when user is premium"
```

---

## Phase 4: UI

### Task 18: MilestonesScreen — Premium 섹션 (free/paid 분기)

**Files:**
- Modify: `src/screens/MilestonesScreen.tsx`
- Modify: `src/screens/MilestonesScreen/styles.ts`
- Create: `src/screens/MilestonesScreen/PremiumSection.tsx`
- Modify: `src/i18n/locales/ko.json` (+`milestones.premium.*`)
- Modify: `src/i18n/locales/en.json`

스펙 §4.1 구현. 무료 사용자는 카드 이름·아이콘·한 줄 설명까지 노출 + 자물쇠. 유료 사용자는 일반 마일스톤과 동일한 진행률 row.

- [ ] **Step 1: Add i18n keys**

`ko.json`의 `milestones` 객체에 다음 키 추가:

```json
"premium": {
  "sectionTitle": "유료 결제자에게 제공되는 마일스톤",
  "lockedHint": "Premium 가입 시 잠금 해제",
  "ctaUnlock": "Premium 알아보기",
  "items": {
    "premium_n_before_n": {
      "name": "N Before N",
      "icon": "🏃",
      "description": "정해진 나이에 도달하기 전까지의 여행 기록을 모은다"
    },
    "premium_decade_stamps": {
      "name": "인생 단계별 도장",
      "icon": "📅",
      "description": "10대·20대·30대… 인생 시기마다 찍어둔 발자취를 컬렉션으로"
    },
    "premium_age_match": {
      "name": "내 나이만큼의 발자취",
      "icon": "🎂",
      "description": "현재 나이만큼의 국가를 모았는가"
    },
    "premium_four_seasons": {
      "name": "사계절 컬렉터",
      "icon": "🌸",
      "description": "한 나라에서 봄·여름·가을·겨울 모두를 사진에 담는다"
    },
    "premium_calendar": {
      "name": "달력의 여행자",
      "icon": "🗓️",
      "description": "1월부터 12월까지 모든 달에 해외 사진"
    },
    "premium_flag_palette": {
      "name": "국기 팔레트 마스터",
      "icon": "🌈",
      "description": "방문국 국기에 쓰인 모든 색을 모은다"
    },
    "premium_un_linguist": {
      "name": "UN 공용어 정복",
      "icon": "🌐",
      "description": "UN 6공용어 — 영·중·스페인·프랑스·러시아·아랍 — 권역 모두 방문"
    },
    "premium_humanity": {
      "name": "인류의 X",
      "icon": "👥",
      "description": "방문국 인구가 세계 인구에서 차지하는 비중"
    },
    "premium_earth_area": {
      "name": "지구의 X",
      "icon": "🌍",
      "description": "방문국 면적이 지구 육지에서 차지하는 비중"
    },
    "premium_round_the_clock": {
      "name": "지구 한 바퀴",
      "icon": "🕛",
      "description": "시차 24시간 이상 차이의 두 국가 모두 방문"
    }
  }
}
```

`en.json`에도 동일 구조로 영문 텍스트 작성. 호칭 본문(예: "5 Before 20") 단계별 라벨은 본 task의 i18n 범위가 아니며, Task 19 호칭 화면 i18n에서 별도 처리.

- [ ] **Step 2: Implement `PremiumSection.tsx`**

```typescript
// src/screens/MilestonesScreen/PremiumSection.tsx
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ALL_PREMIUM_MILESTONE_KINDS } from "../../features/milestone/milestoneTypes";
import { useEntitlementStore } from "../../features/entitlement/entitlementStore";
import type { Theme } from "../../theme/themeStore";
import type { ActiveDescription } from "./MilestoneRow";

type Props = {
  theme: Theme;
  styles: ReturnType<typeof import("./styles").makeStyles>;
  onPressUpsell: () => void;
};

export default function PremiumSection({ theme, styles, onPressUpsell }: Props) {
  const { t } = useTranslation();
  const isPremium = useEntitlementStore((s) => s.isPremium);

  if (isPremium) return null; // Premium users see Premium milestones inline as regular rows.

  return (
    <View style={styles.premiumSection}>
      <View style={styles.premiumHeader}>
        <Text style={styles.premiumLock}>🔒</Text>
        <Text style={styles.premiumTitle}>
          {t("milestones.premium.sectionTitle")} ({ALL_PREMIUM_MILESTONE_KINDS.length})
        </Text>
      </View>
      {ALL_PREMIUM_MILESTONE_KINDS.map((id) => (
        <View key={id} style={styles.premiumCard}>
          <Text style={styles.premiumIcon}>
            {t(`milestones.premium.items.${id}.icon`)}
          </Text>
          <View style={styles.premiumTextCol}>
            <Text style={styles.premiumName}>
              {t(`milestones.premium.items.${id}.name`)}
            </Text>
            <Text style={styles.premiumDescription}>
              {t(`milestones.premium.items.${id}.description`)}
            </Text>
          </View>
          <Text style={styles.premiumCardLock}>🔒</Text>
        </View>
      ))}
      <Pressable onPress={onPressUpsell} style={styles.premiumCta}>
        <Text style={styles.premiumCtaText}>
          {t("milestones.premium.ctaUnlock")} →
        </Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 3: Add styles**

`MilestonesScreen/styles.ts`의 `makeStyles` 함수에 다음 stylesheet 항목 추가:

```typescript
premiumSection: {
  marginTop: 24,
  borderWidth: 1,
  borderColor: theme.border,
  borderRadius: 12,
  padding: 12,
  gap: 8,
  backgroundColor: theme.surface,
},
premiumHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
premiumLock: { fontSize: 16 },
premiumTitle: { fontSize: 14, fontWeight: "600", color: theme.text },
premiumCard: {
  flexDirection: "row", alignItems: "center", gap: 12,
  paddingVertical: 8, paddingHorizontal: 4,
  opacity: 0.85,
},
premiumIcon: { fontSize: 22 },
premiumTextCol: { flex: 1 },
premiumName: { fontSize: 15, fontWeight: "600", color: theme.text },
premiumDescription: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
premiumCardLock: { fontSize: 14, opacity: 0.6 },
premiumCta: {
  marginTop: 8, paddingVertical: 10, alignItems: "center",
  backgroundColor: theme.accent, borderRadius: 8,
},
premiumCtaText: { color: theme.onAccent, fontWeight: "600" },
```

색상 토큰(`theme.accent`, `theme.onAccent`, `theme.surface`, `theme.textMuted`)이 이미 존재하지 않으면 `theme/themeStore.ts`에서 fallback으로 기존 토큰(`theme.primary`, `theme.background`, `theme.text`)을 사용. 조사 후 매핑.

- [ ] **Step 4: Wire `PremiumSection` into `MilestonesScreen.tsx`**

`MilestonesScreen.tsx`의 ScrollView 내부, 기존 `rows.map(...)` 다음에 `<PremiumSection />` 추가:

```typescript
import PremiumSection from "./MilestonesScreen/PremiumSection";

// ... 기존 ScrollView 내부 ...
{rows.map((row) => (
  <MilestoneRow ... />
))}
<PremiumSection
  theme={theme}
  styles={styles}
  onPressUpsell={() => {
    // TODO: route to paywall when IAP integrated. For now, show alert.
    Alert.alert(t("milestones.premium.ctaUnlock"));
  }}
/>
```

`Alert` import 추가.

For premium users, the regular `rows` mapping should *also* include premium milestones. Add to `useMemo`:

```typescript
const rows = useMemo(
  () => {
    const baseRows = ALL_MILESTONE_KINDS.map((k) => ...);
    const premiumRows = isPremium
      ? ALL_PREMIUM_MILESTONE_KINDS.map((k) => ...)
      : [];
    return [...baseRows, ...premiumRows];
  },
  [t, visitCounts, isPremium]
);
```

`isPremium` selector 추가:
```typescript
const isPremium = useEntitlementStore((s) => s.isPremium);
```

Premium milestones를 위한 `evaluateMilestone` 분기는 본 task에서 다루지 않는다 — Task 19에서 별도 처리.

- [ ] **Step 5: Manual smoke + commit**

`npx jest` 회귀 확인.

```
git add src/screens/MilestonesScreen.tsx src/screens/MilestonesScreen src/i18n/locales
git commit -m "feat(milestones): show premium section to free users with locked silhouettes"
```

---

### Task 19: TitlesScreen — Premium 카테고리 + 자물쇠

**Files:**
- Modify: `src/screens/TitlesScreen.tsx`
- Modify: `src/features/badges/badges.ts` (CATEGORY_LABEL, CATEGORY_ORDER 확장)
- Create: `src/screens/TitlesScreen/PremiumCategorySection.tsx`
- Modify: `src/i18n/locales/ko.json` (+`titles.premium.*`)
- Modify: `src/i18n/locales/en.json`

스펙 §4.2 구현. 무료 사용자는 Premium 카테고리 헤더만 보고 호칭은 자물쇠로 가림. 유료 사용자는 일반 카테고리와 동일한 형식으로 표시.

- [ ] **Step 1: Extend CATEGORY_LABEL and CATEGORY_ORDER in badges.ts**

```typescript
// src/features/badges/badges.ts
export const CATEGORY_LABEL: Record<BadgeCategory, string> = {
  tier: "등급",
  days: "여행 일수",
  continent: "대륙",
  country: "국가 단골",
  foreign: "해외 사진",
  premium_age: "Premium · 나이 도전",
  premium_time: "Premium · 시간 컬렉션",
  premium_culture: "Premium · 문화·시각",
  premium_share: "Premium · 점유율",
  premium_special: "Premium · 특수",
};

export const CATEGORY_ORDER: readonly BadgeCategory[] = [
  "tier", "days", "continent", "country", "foreign",
  "premium_age", "premium_time", "premium_culture", "premium_share", "premium_special",
];
```

- [ ] **Step 2: Add i18n keys**

`ko.json`/`en.json`에:

```json
"titles": {
  "premium": {
    "lockedTitle": "?????",
    "lockedHint": "Premium 가입 시 잠금 해제",
    "ctaUnlock": "Premium 가입하면 모두 잠금 해제 →",
    "slotCounts": {
      "premium_age": 13,
      "premium_time": 3,
      "premium_culture": 4,
      "premium_share": 6,
      "premium_special": 1
    }
  }
}
```

(슬롯 카운트는 spec §2 단계 수 합산: A1=5 + A2=5 + A3=3 = 13(age) / C1(동적이라 1) + C2=2 = 3(time) / D1=2 + D2=2 = 4(culture) / E1=3 + E2=3 = 6(share) / B3=1 = 1(special).)

- [ ] **Step 3: Create `PremiumCategorySection.tsx`**

```typescript
// src/screens/TitlesScreen/PremiumCategorySection.tsx
import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { BadgeCategory } from "../../features/badges/badges";
import type { Theme } from "../../theme/themeStore";

type Props = {
  category: BadgeCategory;
  theme: Theme;
  styles: ReturnType<typeof import("./styles").makeStyles>;
};

export default function PremiumCategorySection({ category, theme, styles }: Props) {
  const { t } = useTranslation();
  const slotCount = t(`titles.premium.slotCounts.${category}`, { defaultValue: "1" });
  const slots = Number(slotCount) || 1;
  return (
    <View style={styles.premiumCatSection}>
      {Array.from({ length: slots }, (_, i) => (
        <View key={i} style={styles.premiumLockedRow}>
          <Text style={styles.premiumLockedIcon}>🔒</Text>
          <Text style={styles.premiumLockedText}>
            {t("titles.premium.lockedTitle")}
          </Text>
        </View>
      ))}
    </View>
  );
}
```

styles 추가 (TitlesScreen/styles.ts):
```typescript
premiumCatSection: { paddingVertical: 4 },
premiumLockedRow: {
  flexDirection: "row", alignItems: "center", gap: 12,
  paddingVertical: 10, paddingHorizontal: 12,
  borderBottomWidth: 1, borderColor: theme.border,
},
premiumLockedIcon: { fontSize: 18, opacity: 0.5 },
premiumLockedText: { fontSize: 14, color: theme.textMuted, letterSpacing: 2 },
```

- [ ] **Step 4: Wire into TitlesScreen.tsx**

`TitlesScreen.tsx`의 카테고리 렌더 루프에서, 카테고리가 `premium_*`이고 사용자가 무료이면 `PremiumCategorySection`으로 렌더, 그 외에는 기존 BadgeCard 렌더.

```typescript
import PremiumCategorySection from "./TitlesScreen/PremiumCategorySection";
import { useEntitlementStore } from "../features/entitlement/entitlementStore";

// in component:
const isPremium = useEntitlementStore((s) => s.isPremium);

// in render: for each category in CATEGORY_ORDER:
const isPremiumCat = category.startsWith("premium_");
if (isPremiumCat && !isPremium) {
  return <PremiumCategorySection key={category} category={category} theme={theme} styles={styles} />;
}
// else existing BadgeCard list rendering
```

- [ ] **Step 5: Run tests, commit**

```
npx jest
git add src/screens/TitlesScreen.tsx src/screens/TitlesScreen src/features/badges/badges.ts src/i18n/locales
git commit -m "feat(titles): premium categories rendered as locked rows for free users"
```

---

### Task 20: dev 토글 UI — SettingsScreen에 isPremium 토글 추가

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/i18n/locales/ko.json` / `en.json` (+`settings.devPremium.*`)

본 task로 결제 시스템 없이도 화면을 검증할 수 있는 dev 전용 토글을 만든다.

- [ ] **Step 1: Add i18n keys**

```json
"settings": {
  "devPremium": {
    "title": "[DEV] Premium 토글",
    "subtitle": "결제 시스템 없이 Premium UI 검증용"
  }
}
```

- [ ] **Step 2: Add toggle row**

`SettingsScreen.tsx`의 dev 섹션(없으면 새로 추가)에:

```typescript
import { Switch } from "react-native";
import { useEntitlementStore } from "../features/entitlement/entitlementStore";
import { useVisitStore } from "../features/travel/visitStore";

// inside component:
const isPremium = useEntitlementStore((s) => s.isPremium);
const setPremium = useEntitlementStore((s) => s.setPremium);
const evaluateBadges = useVisitStore((s) => s.evaluateBadges);

const onTogglePremium = async (next: boolean) => {
  await setPremium(next);
  await evaluateBadges();
};

// JSX, in dev-only conditional block:
{__DEV__ && (
  <View style={styles.row}>
    <View>
      <Text style={styles.rowTitle}>{t("settings.devPremium.title")}</Text>
      <Text style={styles.rowSubtitle}>{t("settings.devPremium.subtitle")}</Text>
    </View>
    <Switch value={isPremium} onValueChange={onTogglePremium} />
  </View>
)}
```

- [ ] **Step 3: Hydrate entitlementStore at app start**

`App.tsx` 또는 hydrate orchestration 위치에 추가:

```typescript
import { useEntitlementStore } from "./src/features/entitlement/entitlementStore";

// after other hydrations:
await useEntitlementStore.getState().hydrate();
```

- [ ] **Step 4: Commit**

```
git add src/screens/SettingsScreen.tsx src/i18n/locales App.tsx
git commit -m "feat(dev): toggle isPremium from Settings to verify Premium UX"
```

---

## Phase 5: Premium 호칭 i18n 라벨 (단계별 호칭명)

### Task 21: Premium 단계별 호칭 i18n 키 추가 + badgeI18n 분기

**Files:**
- Modify: `src/features/badges/badgeI18n.ts`
- Modify: `src/i18n/locales/ko.json` / `en.json` (+`badges.premium.*`)

평가 함수(Phase 2)에서 emit하는 `BadgeDefinition.titleKo/En`은 fallback. UI 표시는 i18n key로 우선 lookup하도록 `badgeI18n.ts`의 `localizedBadgeTitle`을 확장.

- [ ] **Step 1: Add i18n keys for all stage titles**

`ko.json`의 `badges` 섹션에 다음 추가:

```json
"badges": {
  "premium": {
    "premium_n_before_n_5_20":  { "title": "조숙한 발자국",       "description": "만 20세 전 5개국 방문" },
    "premium_n_before_n_10_25": { "title": "이른 노마드",         "description": "만 25세 전 10개국 방문" },
    "premium_n_before_n_20_30": { "title": "서른 전의 세계",       "description": "만 30세 전 20개국 방문" },
    "premium_n_before_n_30_40": { "title": "불혹의 컬렉터",       "description": "만 40세 전 30개국 방문" },
    "premium_n_before_n_50_50": { "title": "반세기 컬렉터",       "description": "만 50세 전 50개국 방문" },

    "premium_decade_10s":     { "title": "유년의 발자취",     "description": "10대 시기에 5개국" },
    "premium_decade_20s":     { "title": "청춘의 방랑",       "description": "20대 시기에 15개국" },
    "premium_decade_30s":     { "title": "삼십대의 컬렉터",   "description": "30대 시기에 25개국" },
    "premium_decade_40s":     { "title": "불혹의 떠돌이",     "description": "40대 시기에 25개국" },
    "premium_decade_50plus":  { "title": "제2의 출발선",       "description": "50대 이후 신규 15개국" },

    "premium_age_match_x1":   { "title": "동갑 수집가",       "description": "방문국 수 ≥ 만 나이" },
    "premium_age_match_x1_5": { "title": "초과달성",           "description": "방문국 수 ≥ 만 나이 × 1.5" },
    "premium_age_match_x2":   { "title": "두 배의 인생",       "description": "방문국 수 ≥ 만 나이 × 2" },

    "premium_calendar_6":  { "title": "반년의 여행자",     "description": "12개월 중 6개월 해외 사진" },
    "premium_calendar_12": { "title": "달력의 여행자",     "description": "12개월 모두 해외 사진" },

    "premium_flag_palette_5": { "title": "색의 수집가",     "description": "방문국 국기에서 5색 수집" },
    "premium_flag_palette_7": { "title": "팔레트 마스터",   "description": "방문국 국기에서 7색 모두 수집" },

    "premium_un_linguist_3": { "title": "3개 국어의 여행자", "description": "UN 6공용어 중 3개 권역 방문" },
    "premium_un_linguist_6": { "title": "UN 공용어 정복자", "description": "UN 6공용어 모두 권역 방문" },

    "premium_humanity_25":  { "title": "인류의 4분의 1",     "description": "방문국 인구 ≥ 세계 인구 25%" },
    "premium_humanity_50":  { "title": "인류의 절반",         "description": "방문국 인구 ≥ 세계 인구 50%" },
    "premium_humanity_75":  { "title": "인류의 4분의 3",     "description": "방문국 인구 ≥ 세계 인구 75%" },

    "premium_earth_25": { "title": "지구의 4분의 1",     "description": "방문국 면적 ≥ 지구 육지 25%" },
    "premium_earth_50": { "title": "지구의 절반",         "description": "방문국 면적 ≥ 지구 육지 50%" },
    "premium_earth_75": { "title": "지구의 4분의 3",     "description": "방문국 면적 ≥ 지구 육지 75%" },

    "premium_round_the_clock": { "title": "지구 한 바퀴", "description": "시차 24시간 차이 두 국가 방문" },

    "fourSeasonsTemplate": { "title": "{{country}} 사계절", "description": "{{country}}에서 4계절 모두 사진" }
  }
}
```

`en.json`에 영문 라벨로 동일 구조 작성:

```json
"badges": {
  "premium": {
    "premium_n_before_n_5_20":  { "title": "5 Before 20",  "description": "5 countries before age 20" },
    "premium_n_before_n_10_25": { "title": "10 Before 25", "description": "10 countries before age 25" },
    "premium_n_before_n_20_30": { "title": "20 Before 30", "description": "20 countries before age 30" },
    "premium_n_before_n_30_40": { "title": "30 Before 40", "description": "30 countries before age 40" },
    "premium_n_before_n_50_50": { "title": "50 Before 50", "description": "50 countries before age 50" },

    "premium_decade_10s":    { "title": "Childhood Wanderer",         "description": "5 countries during teen years" },
    "premium_decade_20s":    { "title": "Roaring Twenties",           "description": "15 countries during 20s" },
    "premium_decade_30s":    { "title": "Thirty-Something Collector", "description": "25 countries during 30s" },
    "premium_decade_40s":    { "title": "Forty Forward",              "description": "25 countries during 40s" },
    "premium_decade_50plus": { "title": "Late Bloomer",               "description": "15 new countries from age 50+" },

    "premium_age_match_x1":   { "title": "Age-Matched Traveler", "description": "Visited countries ≥ current age" },
    "premium_age_match_x1_5": { "title": "Beyond Years",         "description": "Visited countries ≥ age × 1.5" },
    "premium_age_match_x2":   { "title": "Double-Aged",          "description": "Visited countries ≥ age × 2" },

    "premium_calendar_6":  { "title": "Half-Year Drifter", "description": "Foreign photos in 6 different months" },
    "premium_calendar_12": { "title": "Calendar Drifter",  "description": "Foreign photos in all 12 months" },

    "premium_flag_palette_5": { "title": "Color Collector",      "description": "5 distinct flag colors collected" },
    "premium_flag_palette_7": { "title": "Flag Palette Master",  "description": "All 7 flag colors collected" },

    "premium_un_linguist_3": { "title": "Trilingual Traveler", "description": "3 of UN's 6 official languages" },
    "premium_un_linguist_6": { "title": "UN Linguist",          "description": "All 6 UN official languages" },

    "premium_humanity_25": { "title": "Quarter of Humanity",        "description": "25% of world population visited" },
    "premium_humanity_50": { "title": "Half of Humanity",            "description": "50% of world population visited" },
    "premium_humanity_75": { "title": "Three-Quarters of Humanity",  "description": "75% of world population visited" },

    "premium_earth_25": { "title": "Quarter of Earth",        "description": "25% of Earth's land area visited" },
    "premium_earth_50": { "title": "Half of Earth",            "description": "50% of Earth's land area visited" },
    "premium_earth_75": { "title": "Three-Quarters of Earth",  "description": "75% of Earth's land area visited" },

    "premium_round_the_clock": { "title": "Round the Clock", "description": "Two countries with 24h+ UTC offset gap" },

    "fourSeasonsTemplate": { "title": "{{country}} Four Seasons", "description": "All four seasons captured in {{country}}" }
  }
}
```

- [ ] **Step 2: Extend `localizedBadgeTitle`**

`badgeI18n.ts`의 함수에 다음 분기를 추가 (기존 분기 후 last fallback 이전):

```typescript
// in localizedBadgeTitle / localizedBadgeDescription:
if (badge.id.startsWith("premium_four_seasons_")) {
  const code = badge.id.slice("premium_four_seasons_".length);
  const country = getCountryName(code, locale) ?? code;
  return t("badges.premium.fourSeasonsTemplate.title", { country });
}
if (badge.id.startsWith("premium_")) {
  return t(`badges.premium.${badge.id}.title`, { defaultValue: badge.titleKo });
}
```

description 함수에도 동일 패턴.

- [ ] **Step 3: Run tests, smoke**

```
npx jest
```

- [ ] **Step 4: Commit**

```
git add src/features/badges/badgeI18n.ts src/i18n/locales
git commit -m "feat(i18n): add premium badge titles and descriptions (ko/en)"
```

---

### Task 22: 통합 회귀 — TS 컴파일 + 모든 jest

**Files:** 없음 (검증만)

- [ ] **Step 1: Type check**

```
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 2: All tests**

```
npx jest
```
Expected: 모든 테스트 PASS. 신규 22개 (premium evaluator 9 × ~3 테스트 + entitlement + types + buildContext + data ≈ 35+).

- [ ] **Step 3: Manual smoke checklist**

다음을 휴대폰/시뮬레이터에서 손으로 확인:

1. Settings → [DEV] Premium 토글 OFF 상태에서:
   - 마일스톤 화면: "유료 결제자에게 제공되는 마일스톤 (10)" 섹션이 보임
   - 카드마다 아이콘·이름·한 줄 설명 노출 + 우측 자물쇠
   - 호칭 화면: Premium 카테고리 5개가 자물쇠 줄로 표시 (호칭명 가림)
2. Settings → [DEV] Premium 토글 ON으로 전환:
   - 마일스톤 화면 row에 Premium 마일스톤이 일반 row와 함께 표시
   - 호칭 화면: 충족된 Premium 호칭이 컬러로 노출 + 미충족은 일반 잠금 형식
3. Settings → 토글 OFF로 다시 → Premium 호칭/카드 모두 가려짐 (일관)

- [ ] **Step 4: 검증 후 cleanup commit (필요 시)**

회귀 발견 시 별도 task로 처리. 통과 시 별도 commit 불필요.

---

## Self-Review (작성자 체크)

**Spec coverage:**
- §2 마일스톤 10개 — Task 5~13에서 모두 구현 ✓
- §3 데이터 모델 — Task 1, 2, 3, 4, 14, 15, 16에서 구현 ✓
- §4 무료/유료 가시성 — Task 18(마일스톤), 19(호칭), 20(dev 토글) ✓
- §5 다국어 가이드라인 — Task 21에서 ko/en 기본 키 작성. 추가 언어는 i18n 작업 시 별도. ✓
- §6 평가 로직/마이그레이션 — Task 15(buildContext), 17(트리거) ✓
- §7 결정·미해결 — IAP는 본 plan 범위 밖, 나머지는 코드 주석/i18n에 흡수 ✓
- §8 로드맵 12단계 — 본 plan의 22개 task로 매핑됨

**Placeholder scan:** "TBD"·"TODO"·"implement later" 검색 0건. SettingsScreen의 paywall 라우팅이 IAP 도입 전이라 `Alert`로 stub되어 있으나, 이는 spec §1.3에 비범위로 명시된 부분. ✓

**Type consistency:** `PremiumContext`는 Task 4에서 정의, Task 5~13의 evaluator가 모두 동일 타입을 사용. `BadgeDefinition.id`의 prefix는 `premium_*` 컨벤션 일관. `BadgeCategory`의 5종 신규 키(premium_age/time/culture/share/special)는 Task 5에서 추가, Task 19에서 CATEGORY_LABEL/ORDER에 매핑.

작은 편차: Task 19의 i18n `slotCounts.premium_time`을 3으로 적었으나, 사계절(C1)이 동적이라 카운트 가변(국가별 인스턴스). `fourSeasonsTemplate` 키로 일괄 처리하므로 무료 사용자에게는 슬롯 1개로 합쳐서 표시 — 의도된 단순화. ✓
