# Premium 마일스톤 대표 선택 가능화 (단계 1: 7종) — 구현 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 유료 사용자가 단계가 명확한 누적형 premium 마일스톤 7종(`humanity`, `earth_area`, `calendar`, `flag_palette`, `un_linguist`, `age_match`, `round_the_clock`)을 대표 마일스톤으로 선택할 수 있게 한다. 무료 마일스톤과 동일한 진행률·다음 호칭 안내 UX 제공.

**Architecture:** `MilestoneProgress.unit`을 5종 추가 확장하고 `unsupportedReason` 필드를 도입한다. `evaluateMilestone` 시그니처를 `MilestoneEvalContext` 객체로 받도록 확장하고, premium 분기는 새 `evaluatePremiumProgress` 모듈에 위임한다. `visitStore`에 `premiumContext`를 캐시하여 UI가 동기적으로 진행률을 재계산할 수 있게 한다. UI는 `PremiumSection`을 무료/유료 두 컴포넌트로 분리한다.

**Tech Stack:** TypeScript, React Native (Expo), Zustand, Jest, react-i18next.

**Spec:** `docs/superpowers/specs/2026-05-09-premium-milestone-selectable-design.md`

---

## File Structure

**Create:**
- `src/features/milestone/premium/evaluatePremiumProgress.ts` — 7종 premium 진행률 평가 (단일 진입점 + 종별 helper)
- `src/features/milestone/premium/evaluatePremiumProgress.test.ts` — TDD 단위 테스트
- `src/screens/MilestonesScreen/PremiumLockedSection.tsx` — 기존 PremiumSection의 잠금 카드 코드를 이동
- `src/screens/MilestonesScreen/PremiumUnlockedSection.tsx` — 유료 사용자용 (선택 가능 7종 row + 정보 카드 3종)

**Modify:**
- `src/features/milestone/milestoneTypes.ts` — `unit` 확장, `unsupportedReason` 추가
- `src/features/milestone/milestoneEvaluator.ts` — `MilestoneEvalContext` 타입, premium 분기 위임
- `src/features/travel/visitStore.ts` — `premiumContext` 캐시 추가
- `src/screens/MilestonesScreen.tsx` — 컨텍스트 빌드, 유료/무료 분기, ActiveDescription 분기 확장
- `src/screens/MilestonesScreen/MilestoneRow.tsx` — `ActiveDescription`/`renderDescription` 분기 확장, `progressText` unsupported 분기
- `src/screens/MilestonesScreen/styles.ts` — Premium 헤더/카드 캡션 스타일 (필요 시)
- `src/screens/MainScreen/index.tsx` — `evaluateMilestone` 호출부 컨텍스트 전달, unsupported 시 진행률 표시 처리
- `src/screens/MainScreen/MilestoneFooterText.tsx` — 새 unit / unsupported 분기
- `src/i18n/locales/ko.json`, `en.json` — 신규 키 27개 (옵션 7 + activeNext 7 + 단위 5 + 캡션 1 + footer 7)
- `src/i18n/locales/{de,es,fr,it,ja,ru,zh-CN,zh-TW}.json` — en.json 값 복제

**Delete:**
- `src/screens/MilestonesScreen/PremiumSection.tsx`

---

## Phase 1 — 데이터 모델 확장

### Task 1: `MilestoneProgress` 타입 확장

**Files:**
- Modify: `src/features/milestone/milestoneTypes.ts:64-78`

- [ ] **Step 1: `MilestoneProgress` 타입에 새 필드와 단위 추가**

기존 (lines 64-78):
```ts
export type MilestoneProgress = {
  kind: MilestoneKind;
  current: number;
  next: number | null;
  nextTitleBadgeId: string | null;
  percent: number;
  reachedFinal: boolean;
  unit: "countries" | "days";
};
```

다음으로 교체:
```ts
export type MilestoneUnit =
  | "countries"
  | "days"
  | "months"
  | "colors"
  | "languages"
  | "percent"
  | "hours";

export type MilestoneUnsupportedReason = "needs_birth" | "needs_home_country";

/** UI에서 진행률·다음 단계를 그리기 위한 평가 결과 */
export type MilestoneProgress = {
  kind: MilestoneKind;
  /** 현재 값 */
  current: number;
  /** 다음 단계 컷오프. 최종 단계 도달 시 null */
  next: number | null;
  /** 다음 단계에서 부여될 호칭의 BadgeId. 최종 단계면 null */
  nextTitleBadgeId: string | null;
  /** 진행률 0~100. 최종 단계는 100 고정 */
  percent: number;
  /** true면 최종 단계 도달 — UI는 "최고 단계 달성" 표시 */
  reachedFinal: boolean;
  /** 푸터 라벨 단위 분기용 */
  unit: MilestoneUnit;
  /**
   * 평가에 필요한 사용자 데이터가 없을 때 사유. UI가 진행률 대신 안내 문구로 분기.
   * null이면 정상 평가 결과 (현재 진행률을 그대로 표시).
   */
  unsupportedReason: MilestoneUnsupportedReason | null;
};
```

- [ ] **Step 2: 타입 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 기존 `buildProgress` 호출부에서 `unsupportedReason` 누락으로 컴파일 에러 발생 → Task 2에서 수정.

- [ ] **Step 3: 컴파일 에러를 차단하기 위해 `milestoneEvaluator.ts`의 `buildProgress`에 `unsupportedReason: null` 기본값 추가**

`src/features/milestone/milestoneEvaluator.ts:33-61`의 `buildProgress`를 수정. `next == null` 분기와 정상 분기 모두에 `unsupportedReason: null` 추가:

```ts
function buildProgress(
  kind: MilestoneKind,
  current: number,
  next: number | null,
  nextTitleBadgeId: string | null,
  unit: MilestoneUnit
): MilestoneProgress {
  if (next == null) {
    return {
      kind,
      current,
      next: null,
      nextTitleBadgeId: null,
      percent: 100,
      reachedFinal: true,
      unit,
      unsupportedReason: null,
    };
  }
  const percent = Math.round((current / next) * 1000) / 10;
  return {
    kind,
    current,
    next,
    nextTitleBadgeId,
    percent: Math.min(100, percent),
    reachedFinal: false,
    unit,
    unsupportedReason: null,
  };
}
```

`MilestoneUnit` import 추가:
```ts
import {
  ContinentMilestoneId,
  isPremiumMilestoneKind,
  MilestoneKind,
  MilestoneProgress,
  MilestoneUnit,
} from "./milestoneTypes";
```

`buildProgress`의 `unit` 파라미터 타입을 `"countries" | "days"`에서 `MilestoneUnit`으로 변경.

- [ ] **Step 4: 컴파일 재확인**

Run: `npx tsc --noEmit`
Expected: PASS (no errors in milestone files).

- [ ] **Step 5: Commit**

```bash
git add src/features/milestone/milestoneTypes.ts src/features/milestone/milestoneEvaluator.ts
git commit -m "refactor(milestone): MilestoneProgress에 unit 5종·unsupportedReason 필드 추가"
```

---

### Task 2: `MilestoneEvalContext` 타입 도입 + `evaluateMilestone` 시그니처 확장

**Files:**
- Modify: `src/features/milestone/milestoneEvaluator.ts:63-111`
- Modify: `src/screens/MilestonesScreen.tsx:42` (호출부)
- Modify: `src/screens/MainScreen/index.tsx:273-276` (호출부)

- [ ] **Step 1: `MilestoneEvalContext` 타입 정의 및 `evaluateMilestone` 시그니처 변경**

`src/features/milestone/milestoneEvaluator.ts` 상단에 `PremiumContext` import 추가:

```ts
import type { PremiumContext } from "./premium/types";
```

`evaluateMilestone` export 위에 타입 추가:

```ts
/**
 * `evaluateMilestone`에 주입되는 컨텍스트.
 * 무료 마일스톤(countries/days/continent_*)은 `visitCounts`만 참조한다.
 * Premium 마일스톤은 `premiumContext`도 필요하다 — null이면 평가 불가 처리.
 */
export type MilestoneEvalContext = {
  visitCounts: Record<string, number>;
  /**
   * Premium 평가에 필요한 컨텍스트. 무료 사용자(`isAllMilestoneVisible: false`)이거나
   * 아직 로드되지 않았으면 null. Premium kind 평가 시 null이면 unsupportedReason 반환.
   */
  premiumContext: PremiumContext | null;
};
```

기존 `evaluateMilestone` 시그니처 변경:

```ts
export function evaluateMilestone(
  kind: MilestoneKind,
  ctx: MilestoneEvalContext
): MilestoneProgress {
  const { visitCounts, premiumContext } = ctx;

  if (kind === "countries") {
    // ... 기존 코드, visitCounts만 사용
  }
  if (kind === "days") {
    // ... 기존 코드
  }
  // 프리미엄 마일스톤은 별도 평가기에 위임 (Task 5에서 채움)
  if (isPremiumMilestoneKind(kind)) {
    return buildProgress(kind, 0, null, null, "countries");
  }
  // 대륙 마일스톤 — 기존 코드
  // ...
}
```

기존 `evaluateMilestone(kind, visitCounts)`을 `evaluateMilestone(kind, ctx)`로 바꾸되, **premium 분기는 Task 5에서 채우므로 지금은 placeholder 그대로 둔다.**

- [ ] **Step 2: `MilestonesScreen.tsx` 호출부 수정**

`src/screens/MilestonesScreen.tsx:42` 부근:

```ts
const progress = evaluateMilestone(k, { visitCounts, premiumContext: null });
```

(Task 7에서 실제 컨텍스트로 교체.)

- [ ] **Step 3: `MainScreen/index.tsx` 호출부 수정**

`src/screens/MainScreen/index.tsx:273-276`:

```ts
const milestoneProgress = useMemo(
  () => evaluateMilestone(milestoneKind, { visitCounts, premiumContext: null }),
  [milestoneKind, visitCounts]
);
```

(Task 7에서 실제 컨텍스트로 교체.)

- [ ] **Step 4: 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: 기존 테스트 회귀 확인**

Run: `npx jest src/features/milestone/`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/milestone/milestoneEvaluator.ts src/screens/MilestonesScreen.tsx src/screens/MainScreen/index.tsx
git commit -m "refactor(milestone): evaluateMilestone에 MilestoneEvalContext 도입"
```

---

## Phase 2 — Premium 진행률 평가기 (TDD)

### Task 3: `evaluatePremiumProgress` 스켈레톤 + `humanity` (TDD)

**Files:**
- Create: `src/features/milestone/premium/evaluatePremiumProgress.ts`
- Create: `src/features/milestone/premium/evaluatePremiumProgress.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`src/features/milestone/premium/evaluatePremiumProgress.test.ts`:

```ts
import { evaluatePremiumProgress } from "./evaluatePremiumProgress";
import type { PremiumContext } from "./types";

const baseCtx: PremiumContext = {
  birth: null,
  homeCountry: "KR",
  photos: [],
  visitedCountriesCount: 0,
  visitedCountryCodes: [],
  currentAge: null,
};

describe("evaluatePremiumProgress - humanity", () => {
  it("0% 진행: current=0, next=25, percent=0, unit=percent", () => {
    const p = evaluatePremiumProgress("premium_humanity", { ...baseCtx, visitedCountryCodes: [] });
    expect(p.current).toBe(0);
    expect(p.next).toBe(25);
    expect(p.percent).toBe(0);
    expect(p.unit).toBe("percent");
    expect(p.nextTitleBadgeId).toBe("premium_humanity_25");
    expect(p.reachedFinal).toBe(false);
    expect(p.unsupportedReason).toBeNull();
  });

  it("25% 도달 시 다음 컷오프 50으로 이동", () => {
    // CN+IN: 약 35% 인구. POPULATION_BY_CODE 기준.
    const p = evaluatePremiumProgress("premium_humanity", { ...baseCtx, visitedCountryCodes: ["CN", "IN"] });
    expect(p.current).toBeGreaterThanOrEqual(25);
    expect(p.next).toBe(50);
    expect(p.nextTitleBadgeId).toBe("premium_humanity_50");
    expect(p.reachedFinal).toBe(false);
  });

  it("75% 도달 시 reachedFinal=true", () => {
    // 인구 상위 다수 국가. 75% 이상 달성.
    const p = evaluatePremiumProgress("premium_humanity", {
      ...baseCtx,
      visitedCountryCodes: ["CN", "IN", "US", "ID", "PK", "BR", "NG", "BD", "RU", "MX", "JP", "ET", "PH", "EG", "VN", "CD", "IR", "TR", "DE", "TH"],
    });
    expect(p.reachedFinal).toBe(true);
    expect(p.next).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest src/features/milestone/premium/evaluatePremiumProgress.test.ts -t humanity`
Expected: FAIL with "Cannot find module './evaluatePremiumProgress'" 또는 "evaluatePremiumProgress is not a function".

- [ ] **Step 3: `evaluatePremiumProgress` 모듈 생성 (humanity만 구현)**

`src/features/milestone/premium/evaluatePremiumProgress.ts`:

```ts
import type {
  MilestoneProgress,
  MilestoneUnit,
  PremiumMilestoneId,
} from "../milestoneTypes";
import {
  POPULATION_BY_CODE,
  WORLD_POPULATION,
} from "../../badges/data";
import type { PremiumContext } from "./types";

type CutoffStage = { cutoff: number; badgeId: string };

function fromStages(
  kind: PremiumMilestoneId,
  current: number,
  stages: CutoffStage[],
  unit: MilestoneUnit
): MilestoneProgress {
  const next = stages.find((s) => current < s.cutoff);
  if (!next) {
    return {
      kind,
      current,
      next: null,
      nextTitleBadgeId: null,
      percent: 100,
      reachedFinal: true,
      unit,
      unsupportedReason: null,
    };
  }
  const percent = Math.min(100, Math.round((current / next.cutoff) * 1000) / 10);
  return {
    kind,
    current,
    next: next.cutoff,
    nextTitleBadgeId: next.badgeId,
    percent,
    reachedFinal: false,
    unit,
    unsupportedReason: null,
  };
}

function evaluateHumanity(ctx: PremiumContext): MilestoneProgress {
  let pop = 0;
  for (const code of ctx.visitedCountryCodes) {
    pop += POPULATION_BY_CODE[code] ?? 0;
  }
  const current = Math.floor((pop / WORLD_POPULATION) * 100);
  return fromStages(
    "premium_humanity",
    current,
    [
      { cutoff: 25, badgeId: "premium_humanity_25" },
      { cutoff: 50, badgeId: "premium_humanity_50" },
      { cutoff: 75, badgeId: "premium_humanity_75" },
    ],
    "percent"
  );
}

export function evaluatePremiumProgress(
  kind: PremiumMilestoneId,
  ctx: PremiumContext
): MilestoneProgress {
  switch (kind) {
    case "premium_humanity":
      return evaluateHumanity(ctx);
    default:
      // 다른 kind는 후속 Task에서 채움
      return {
        kind,
        current: 0,
        next: null,
        nextTitleBadgeId: null,
        percent: 0,
        reachedFinal: false,
        unit: "countries",
        unsupportedReason: null,
      };
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx jest src/features/milestone/premium/evaluatePremiumProgress.test.ts -t humanity`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/milestone/premium/evaluatePremiumProgress.ts src/features/milestone/premium/evaluatePremiumProgress.test.ts
git commit -m "feat(milestone): evaluatePremiumProgress 스켈레톤 + humanity 진행률"
```

---

### Task 4: `earth_area`, `calendar`, `flag_palette`, `un_linguist` 추가 (TDD)

**Files:**
- Modify: `src/features/milestone/premium/evaluatePremiumProgress.ts`
- Modify: `src/features/milestone/premium/evaluatePremiumProgress.test.ts`

- [ ] **Step 1: `earth_area` 테스트 추가**

`evaluatePremiumProgress.test.ts`에 추가:

```ts
describe("evaluatePremiumProgress - earth_area", () => {
  it("0% 진행", () => {
    const p = evaluatePremiumProgress("premium_earth_area", { ...baseCtx, visitedCountryCodes: [] });
    expect(p.current).toBe(0);
    expect(p.next).toBe(25);
    expect(p.unit).toBe("percent");
    expect(p.nextTitleBadgeId).toBe("premium_earth_25");
  });

  it("러시아만 방문해도 25% 미만 (러시아 ~11.5%)", () => {
    const p = evaluatePremiumProgress("premium_earth_area", { ...baseCtx, visitedCountryCodes: ["RU"] });
    expect(p.next).toBe(25);
    expect(p.current).toBeLessThan(25);
    expect(p.current).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx jest evaluatePremiumProgress -t earth_area`
Expected: FAIL.

- [ ] **Step 3: `earth_area` 구현**

`evaluatePremiumProgress.ts` 상단 import에 추가:
```ts
import {
  POPULATION_BY_CODE,
  WORLD_POPULATION,
  AREA_BY_CODE,
  EARTH_LAND_AREA_KM2,
} from "../../badges/data";
```

새 함수 추가:
```ts
function evaluateEarthArea(ctx: PremiumContext): MilestoneProgress {
  let area = 0;
  for (const code of ctx.visitedCountryCodes) {
    area += AREA_BY_CODE[code] ?? 0;
  }
  const current = Math.floor((area / EARTH_LAND_AREA_KM2) * 100);
  return fromStages(
    "premium_earth_area",
    current,
    [
      { cutoff: 25, badgeId: "premium_earth_25" },
      { cutoff: 50, badgeId: "premium_earth_50" },
      { cutoff: 75, badgeId: "premium_earth_75" },
    ],
    "percent"
  );
}
```

`switch`에 case 추가:
```ts
case "premium_earth_area":
  return evaluateEarthArea(ctx);
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx jest evaluatePremiumProgress -t earth_area`
Expected: PASS.

- [ ] **Step 5: `calendar` 테스트 추가**

```ts
describe("evaluatePremiumProgress - calendar", () => {
  const photo = (countryCode: string, monthsBack: number): import("./types").PremiumPhoto => ({
    countryCode,
    takenAtMs: new Date(2025, monthsBack - 1, 15).getTime(),
  });

  it("homeCountry 없으면 needs_home_country", () => {
    const p = evaluatePremiumProgress("premium_calendar", { ...baseCtx, homeCountry: null });
    expect(p.unsupportedReason).toBe("needs_home_country");
    expect(p.unit).toBe("months");
  });

  it("본국 사진은 카운트하지 않음", () => {
    const p = evaluatePremiumProgress("premium_calendar", {
      ...baseCtx,
      homeCountry: "KR",
      photos: [photo("KR", 1), photo("KR", 6), photo("JP", 3)],
    });
    expect(p.current).toBe(1);
    expect(p.next).toBe(6);
    expect(p.unit).toBe("months");
    expect(p.nextTitleBadgeId).toBe("premium_calendar_6");
  });

  it("6개월 채우면 다음 컷오프 12로 이동", () => {
    const photos = [1, 2, 3, 4, 5, 6].map((m) => photo("JP", m));
    const p = evaluatePremiumProgress("premium_calendar", { ...baseCtx, photos });
    expect(p.current).toBe(6);
    expect(p.next).toBe(12);
    expect(p.nextTitleBadgeId).toBe("premium_calendar_12");
  });

  it("12개월 모두 채우면 reachedFinal", () => {
    const photos = Array.from({ length: 12 }, (_, i) => photo("JP", i + 1));
    const p = evaluatePremiumProgress("premium_calendar", { ...baseCtx, photos });
    expect(p.reachedFinal).toBe(true);
    expect(p.next).toBeNull();
  });
});
```

- [ ] **Step 6: 실패 확인 후 `calendar` 구현**

Run: `npx jest evaluatePremiumProgress -t calendar`
Expected: FAIL.

`evaluatePremiumProgress.ts`에 추가:

```ts
function evaluateCalendar(ctx: PremiumContext): MilestoneProgress {
  if (!ctx.homeCountry) {
    return {
      kind: "premium_calendar",
      current: 0,
      next: null,
      nextTitleBadgeId: null,
      percent: 0,
      reachedFinal: false,
      unit: "months",
      unsupportedReason: "needs_home_country",
    };
  }
  const months = new Set<number>();
  for (const p of ctx.photos) {
    if (p.countryCode === ctx.homeCountry) continue;
    months.add(new Date(p.takenAtMs).getMonth() + 1);
  }
  return fromStages(
    "premium_calendar",
    months.size,
    [
      { cutoff: 6, badgeId: "premium_calendar_6" },
      { cutoff: 12, badgeId: "premium_calendar_12" },
    ],
    "months"
  );
}
```

`switch`에 추가:
```ts
case "premium_calendar":
  return evaluateCalendar(ctx);
```

- [ ] **Step 7: 통과 확인**

Run: `npx jest evaluatePremiumProgress -t calendar`
Expected: PASS (4 tests).

- [ ] **Step 8: `flag_palette` 테스트 + 구현**

테스트 추가:
```ts
describe("evaluatePremiumProgress - flag_palette", () => {
  it("0색", () => {
    const p = evaluatePremiumProgress("premium_flag_palette", { ...baseCtx, visitedCountryCodes: [] });
    expect(p.current).toBe(0);
    expect(p.next).toBe(5);
    expect(p.unit).toBe("colors");
    expect(p.nextTitleBadgeId).toBe("premium_flag_palette_5");
  });

  it("KR 국기는 4색(red, blue, black, white) → next=5 미달", () => {
    const p = evaluatePremiumProgress("premium_flag_palette", { ...baseCtx, visitedCountryCodes: ["KR"] });
    expect(p.current).toBe(4);
    expect(p.next).toBe(5);
  });

  it("7색 모두 모으면 reachedFinal", () => {
    // 충분히 다양한 국기 보유 국가 조합 (BR=green/yellow, KR=red/blue/black/white, IE=orange)
    const p = evaluatePremiumProgress("premium_flag_palette", {
      ...baseCtx,
      visitedCountryCodes: ["BR", "KR", "IE"],
    });
    expect(p.current).toBe(7);
    expect(p.reachedFinal).toBe(true);
  });
});
```

Run: `npx jest evaluatePremiumProgress -t flag_palette`
Expected: FAIL.

구현 추가:
```ts
import { FLAG_COLORS_BY_CODE, OFFICIAL_LANGUAGES_BY_CODE } from "../../badges/data";

function evaluateFlagPalette(ctx: PremiumContext): MilestoneProgress {
  const colors = new Set<string>();
  for (const code of ctx.visitedCountryCodes) {
    for (const c of FLAG_COLORS_BY_CODE[code] ?? []) colors.add(c);
  }
  return fromStages(
    "premium_flag_palette",
    colors.size,
    [
      { cutoff: 5, badgeId: "premium_flag_palette_5" },
      { cutoff: 7, badgeId: "premium_flag_palette_7" },
    ],
    "colors"
  );
}
```

`switch`에 case 추가. 통과 확인: `npx jest evaluatePremiumProgress -t flag_palette` → PASS.

- [ ] **Step 9: `un_linguist` 테스트 + 구현**

테스트 추가:
```ts
describe("evaluatePremiumProgress - un_linguist", () => {
  it("0언어", () => {
    const p = evaluatePremiumProgress("premium_un_linguist", { ...baseCtx, visitedCountryCodes: [] });
    expect(p.current).toBe(0);
    expect(p.next).toBe(3);
    expect(p.unit).toBe("languages");
    expect(p.nextTitleBadgeId).toBe("premium_un_linguist_3");
  });

  it("KR(en 없음) → 0", () => {
    // 한국 공용어는 ko라 UN 6공용어 set과 무관 → OFFICIAL_LANGUAGES_BY_CODE에 KR이 있다면 0개 OR 빈
    const p = evaluatePremiumProgress("premium_un_linguist", { ...baseCtx, visitedCountryCodes: ["KR"] });
    expect(p.current).toBe(0);
  });

  it("US(en) + CN(zh) + ES(es) → 3 도달", () => {
    const p = evaluatePremiumProgress("premium_un_linguist", { ...baseCtx, visitedCountryCodes: ["US", "CN", "ES"] });
    expect(p.current).toBe(3);
    expect(p.next).toBe(6);
    expect(p.nextTitleBadgeId).toBe("premium_un_linguist_6");
  });

  it("6 모두 모으면 reachedFinal", () => {
    // US(en), CN(zh), ES(es), FR(fr), RU(ru), EG(ar)
    const p = evaluatePremiumProgress("premium_un_linguist", {
      ...baseCtx,
      visitedCountryCodes: ["US", "CN", "ES", "FR", "RU", "EG"],
    });
    expect(p.current).toBe(6);
    expect(p.reachedFinal).toBe(true);
  });
});
```

구현:
```ts
function evaluateUnLinguist(ctx: PremiumContext): MilestoneProgress {
  const langs = new Set<string>();
  for (const code of ctx.visitedCountryCodes) {
    for (const l of OFFICIAL_LANGUAGES_BY_CODE[code] ?? []) langs.add(l);
  }
  return fromStages(
    "premium_un_linguist",
    langs.size,
    [
      { cutoff: 3, badgeId: "premium_un_linguist_3" },
      { cutoff: 6, badgeId: "premium_un_linguist_6" },
    ],
    "languages"
  );
}
```

`switch`에 case 추가.

Run: `npx jest evaluatePremiumProgress -t un_linguist`
Expected: PASS.

- [ ] **Step 10: 전체 테스트 PASS 확인 및 commit**

Run: `npx jest src/features/milestone/`
Expected: PASS (모든 테스트).

```bash
git add src/features/milestone/premium/evaluatePremiumProgress.ts src/features/milestone/premium/evaluatePremiumProgress.test.ts
git commit -m "feat(milestone): premium 진행률 4종 추가 (earth_area/calendar/flag_palette/un_linguist)"
```

---

### Task 5: `age_match`, `round_the_clock` 추가 + `evaluateMilestone` 위임 (TDD)

**Files:**
- Modify: `src/features/milestone/premium/evaluatePremiumProgress.ts`
- Modify: `src/features/milestone/premium/evaluatePremiumProgress.test.ts`
- Modify: `src/features/milestone/milestoneEvaluator.ts:92-94`

- [ ] **Step 1: `age_match` 테스트**

```ts
describe("evaluatePremiumProgress - age_match", () => {
  it("birth/currentAge 없으면 needs_birth", () => {
    const p = evaluatePremiumProgress("premium_age_match", { ...baseCtx, currentAge: null });
    expect(p.unsupportedReason).toBe("needs_birth");
    expect(p.unit).toBe("countries");
  });

  it("만 30세, 방문 10개국 → x1=30 미달", () => {
    const p = evaluatePremiumProgress("premium_age_match", {
      ...baseCtx,
      currentAge: 30,
      visitedCountryCodes: Array.from({ length: 10 }, (_, i) => `C${i}`),
    });
    expect(p.current).toBe(10);
    expect(p.next).toBe(30);
    expect(p.nextTitleBadgeId).toBe("premium_age_match_x1");
  });

  it("만 30세, 방문 30개국 → x1.5=45 다음 단계", () => {
    const p = evaluatePremiumProgress("premium_age_match", {
      ...baseCtx,
      currentAge: 30,
      visitedCountryCodes: Array.from({ length: 30 }, (_, i) => `C${i}`),
    });
    expect(p.current).toBe(30);
    expect(p.next).toBe(45);
    expect(p.nextTitleBadgeId).toBe("premium_age_match_x1_5");
  });

  it("만 30세, 방문 60개국 → x2 도달, reachedFinal", () => {
    const p = evaluatePremiumProgress("premium_age_match", {
      ...baseCtx,
      currentAge: 30,
      visitedCountryCodes: Array.from({ length: 60 }, (_, i) => `C${i}`),
    });
    expect(p.reachedFinal).toBe(true);
    expect(p.next).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인 후 구현**

Run: `npx jest evaluatePremiumProgress -t age_match`
Expected: FAIL.

`evaluatePremiumProgress.ts`에 추가:
```ts
function evaluateAgeMatch(ctx: PremiumContext): MilestoneProgress {
  if (ctx.currentAge == null) {
    return {
      kind: "premium_age_match",
      current: 0,
      next: null,
      nextTitleBadgeId: null,
      percent: 0,
      reachedFinal: false,
      unit: "countries",
      unsupportedReason: "needs_birth",
    };
  }
  const age = ctx.currentAge;
  return fromStages(
    "premium_age_match",
    ctx.visitedCountryCodes.length,
    [
      { cutoff: Math.round(age * 1), badgeId: "premium_age_match_x1" },
      { cutoff: Math.round(age * 1.5), badgeId: "premium_age_match_x1_5" },
      { cutoff: Math.round(age * 2), badgeId: "premium_age_match_x2" },
    ],
    "countries"
  );
}
```

`switch`에 case 추가:
```ts
case "premium_age_match":
  return evaluateAgeMatch(ctx);
```

Run: `npx jest evaluatePremiumProgress -t age_match`
Expected: PASS.

- [ ] **Step 3: `round_the_clock` 테스트**

```ts
describe("evaluatePremiumProgress - round_the_clock", () => {
  it("방문국 0개 → 0/24", () => {
    const p = evaluatePremiumProgress("premium_round_the_clock", { ...baseCtx, visitedCountryCodes: [] });
    expect(p.current).toBe(0);
    expect(p.next).toBe(24);
    expect(p.unit).toBe("hours");
    expect(p.nextTitleBadgeId).toBe("premium_round_the_clock");
  });

  it("KR(UTC+9) 단독 → max-min=0", () => {
    const p = evaluatePremiumProgress("premium_round_the_clock", { ...baseCtx, visitedCountryCodes: ["KR"] });
    expect(p.current).toBe(0);
    expect(p.next).toBe(24);
  });

  it("키리바시(UTC+14) + 미국령 사모아(UTC-11) → 25시간 → reachedFinal", () => {
    const p = evaluatePremiumProgress("premium_round_the_clock", {
      ...baseCtx,
      visitedCountryCodes: ["KI", "AS"],
    });
    expect(p.current).toBeGreaterThanOrEqual(24);
    expect(p.reachedFinal).toBe(true);
  });
});
```

- [ ] **Step 4: 실패 확인 후 구현**

Run: `npx jest evaluatePremiumProgress -t round_the_clock`
Expected: FAIL.

`evaluatePremiumProgress.ts` import 확장:
```ts
import {
  POPULATION_BY_CODE,
  WORLD_POPULATION,
  AREA_BY_CODE,
  EARTH_LAND_AREA_KM2,
  FLAG_COLORS_BY_CODE,
  OFFICIAL_LANGUAGES_BY_CODE,
  UTC_OFFSET_BY_CODE,
} from "../../badges/data";
```

함수 추가:
```ts
function evaluateRoundTheClock(ctx: PremiumContext): MilestoneProgress {
  let min = +Infinity;
  let max = -Infinity;
  for (const code of ctx.visitedCountryCodes) {
    const off = UTC_OFFSET_BY_CODE[code];
    if (off == null) continue;
    if (off < min) min = off;
    if (off > max) max = off;
  }
  const current = max === -Infinity || min === +Infinity ? 0 : Math.max(0, max - min);
  return fromStages(
    "premium_round_the_clock",
    current,
    [{ cutoff: 24, badgeId: "premium_round_the_clock" }],
    "hours"
  );
}
```

`switch`에 case 추가:
```ts
case "premium_round_the_clock":
  return evaluateRoundTheClock(ctx);
```

Run: `npx jest evaluatePremiumProgress -t round_the_clock`
Expected: PASS.

- [ ] **Step 5: `default` case 정리 — 범위 외 3종(`n_before_n`, `decade_stamps`, `four_seasons`)은 unsupported로 표시**

`evaluatePremiumProgress.ts`의 `switch` `default`를 다음으로 교체:
```ts
default:
  // 단계 1 범위 외 (n_before_n, decade_stamps, four_seasons): 진행률 미지원.
  // UI는 이들을 카드 형태로만 보여주므로 호출되지 않아야 하지만, 안전한 fallback을 둔다.
  return {
    kind,
    current: 0,
    next: null,
    nextTitleBadgeId: null,
    percent: 0,
    reachedFinal: false,
    unit: "countries",
    unsupportedReason: null,
  };
```

- [ ] **Step 6: `evaluateMilestone`에서 premium 분기 위임**

`src/features/milestone/milestoneEvaluator.ts` 상단 import 추가:
```ts
import { evaluatePremiumProgress } from "./premium/evaluatePremiumProgress";
```

기존 placeholder (premium 분기) 교체:
```ts
if (isPremiumMilestoneKind(kind)) {
  if (!premiumContext) {
    return {
      kind,
      current: 0,
      next: null,
      nextTitleBadgeId: null,
      percent: 0,
      reachedFinal: false,
      unit: "countries",
      unsupportedReason: null,
    };
  }
  return evaluatePremiumProgress(kind, premiumContext);
}
```

(premiumContext가 null이면 비활성 상태 — UI는 이 상태를 진행률 0으로 표시하거나 별도 처리 가능. 본격 평가는 visitStore에 컨텍스트가 채워진 후 자연스럽게 발생.)

- [ ] **Step 7: 전체 테스트 PASS + 컴파일**

Run:
```bash
npx tsc --noEmit
npx jest src/features/milestone/
```
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/milestone/premium/evaluatePremiumProgress.ts src/features/milestone/premium/evaluatePremiumProgress.test.ts src/features/milestone/milestoneEvaluator.ts
git commit -m "feat(milestone): age_match/round_the_clock + evaluateMilestone에서 premium 위임"
```

---

## Phase 3 — `premiumContext` 캐시 (visitStore)

### Task 6: `visitStore`에 `premiumContext` 필드 추가

**Files:**
- Modify: `src/features/travel/visitStore.ts`

- [ ] **Step 1: 상태 타입 확장**

`src/features/travel/visitStore.ts`의 zustand state 타입 (`type State = { ... }`)에 `premiumContext` 필드 추가. import 위치(상단):

```ts
import type { PremiumContext } from "../milestone/premium/types";
```

state 타입(`70` 부근의 `homeCountry: HomeCountry | null;` 다음 줄):
```ts
premiumContext: PremiumContext | null;
```

초기값(107 부근 `homeCountry: null,` 다음 줄):
```ts
premiumContext: null,
```

- [ ] **Step 2: `evaluateBadges` 내부에서 캐시 채우기**

`evaluateBadges` 함수의 premium 평가 분기(현재 240-249 부근):

```ts
let premiumBadges: BadgeDefinition[] = [];
let premiumContext: PremiumContext | null = null;
if (useEntitlementStore.getState().isAllMilestoneVisible) {
  const profile = useProfileStore.getState().profile;
  premiumContext = await buildPremiumContext({
    profile,
    homeCountryCode: homeCountry.code,
    visitedCountryCodes: Object.keys(visitCounts),
    now: Date.now(),
  });
  premiumBadges = evaluatePremiumBadges(premiumContext);
}
set({ premiumContext });
await useBadgeStore.getState().evaluate(
  // ... 기존 동일
);
```

- [ ] **Step 3: 컴파일 + 회귀 테스트**

Run:
```bash
npx tsc --noEmit
npx jest
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/features/travel/visitStore.ts
git commit -m "feat(visit): premiumContext 캐시 (UI에서 premium 진행률 동기 평가용)"
```

---

### Task 7: 호출부에서 `premiumContext` 전달

**Files:**
- Modify: `src/screens/MilestonesScreen.tsx`
- Modify: `src/screens/MainScreen/index.tsx`

- [ ] **Step 1: `MilestonesScreen.tsx`에서 컨텍스트 selector 추가 후 전달**

`src/screens/MilestonesScreen.tsx:38` 근처에 추가:
```ts
const premiumContext = useVisitStore((s) => s.premiumContext);
```

`src/screens/MilestonesScreen.tsx:42` 부근의 `evaluateMilestone` 호출 수정:
```ts
const progress = evaluateMilestone(k, { visitCounts, premiumContext });
```

`useMemo` deps에 `premiumContext` 추가:
```ts
}, [t, visitCounts, premiumContext]);
```

- [ ] **Step 2: `MainScreen/index.tsx` 동일 수정**

`MainScreen/index.tsx:272-276`:
```ts
const milestoneKind = useMilestoneStore((s) => s.kind);
const premiumContext = useVisitStore((s) => s.premiumContext);
const milestoneProgress = useMemo(
  () => evaluateMilestone(milestoneKind, { visitCounts, premiumContext }),
  [milestoneKind, visitCounts, premiumContext]
);
```

- [ ] **Step 3: 컴파일**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/screens/MilestonesScreen.tsx src/screens/MainScreen/index.tsx
git commit -m "feat(milestone): MilestonesScreen·MainScreen에 premiumContext 전달"
```

---

## Phase 4 — i18n 키 추가

### Task 8: `ko.json`, `en.json`에 신규 키 추가

**Files:**
- Modify: `src/i18n/locales/ko.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: `ko.json`의 `milestones.option`에 7종 추가**

`src/i18n/locales/ko.json:216-224`의 `option` 객체:
```json
"option": {
  "countries": "국가 수",
  "days": "누적 일수",
  "continent_AS": "아시아 전문가",
  "continent_EU": "유럽 전문가",
  "continent_SA": "남미 전문가",
  "continent_AF": "아프리카 전문가",
  "continent_NA": "북미 전문가",
  "premium_humanity": "인류의 X",
  "premium_earth_area": "지구의 X",
  "premium_calendar": "달력의 여행자",
  "premium_flag_palette": "국기 팔레트 마스터",
  "premium_un_linguist": "UN 공용어 정복",
  "premium_age_match": "내 나이만큼의 발자취",
  "premium_round_the_clock": "지구 한 바퀴"
},
```

- [ ] **Step 2: `ko.json`의 `milestones.activeNext`에 7종 추가**

`src/i18n/locales/ko.json:229-233`의 `activeNext` 객체:
```json
"activeNext": {
  "countries": "{{count}}개국을 여행하면 <b>{{title}}</b> 호칭을 얻습니다",
  "days": "{{count}}일을 여행하면 <b>{{title}}</b> 호칭을 얻습니다",
  "completed": "최고 단계 달성! 모든 호칭을 얻었어요",
  "months": "{{count}}개월을 더 채우면 <b>{{title}}</b> 호칭을 얻습니다",
  "colors": "{{count}}색을 더 모으면 <b>{{title}}</b> 호칭을 얻습니다",
  "languages": "공용어 {{count}}개를 더 추가하면 <b>{{title}}</b> 호칭을 얻습니다",
  "percent": "{{count}}% 더 채우면 <b>{{title}}</b> 호칭을 얻습니다",
  "hours": "시차 {{count}}시간을 더 넓히면 <b>{{title}}</b> 호칭을 얻습니다",
  "needsBirth": "프로필에 생일을 입력하면 진행률이 표시됩니다",
  "needsHomeCountry": "본국이 설정되어야 진행률이 계산됩니다"
},
```

- [ ] **Step 3: `ko.json`의 `milestones.premium`에 캡션 키 추가**

`src/i18n/locales/ko.json:235-251`의 `premium` 객체에 다음을 추가 (기존 키 유지):
```json
"premium": {
  "sectionTitle": "유료 결제자에게 제공되는 마일스톤",
  "lockedHint": "Premium 가입 시 잠금 해제",
  "ctaUnlock": "Premium 알아보기",
  "subsectionUnsupported": "달성 시 호칭이 자동 부여됩니다",
  "items": { /* ... 기존 ... */ }
}
```

- [ ] **Step 4: `ko.json`의 `home`에 신규 단위 + 신규 footer 키 추가**

`src/i18n/locales/ko.json:392-394` 부근의 `home` 객체:
```json
"countriesUnit": "개국",
"daysUnit": "일",
"monthsUnit": "개월",
"colorsUnit": "색",
"languagesUnit": "언어",
"percentUnit": "%",
"hoursUnit": "시간",
```

`milestoneFooter`에 추가 (380-384 부근):
```json
"milestoneFooter": {
  "countries": "{{title}} 호칭 획득까지 {{count}}개국",
  "days": "{{title}} 호칭 획득까지 {{count}}일",
  "completed": "최고 단계 달성 🎉",
  "months": "{{title}} 호칭 획득까지 {{count}}개월",
  "colors": "{{title}} 호칭 획득까지 {{count}}색",
  "languages": "{{title}} 호칭 획득까지 공용어 {{count}}개",
  "percent": "{{title}} 호칭 획득까지 {{count}}%",
  "hours": "{{title}} 호칭 획득까지 시차 {{count}}시간",
  "needsBirth": "프로필에 생일을 입력해주세요",
  "needsHomeCountry": "본국을 설정해주세요"
},
```

- [ ] **Step 5: `en.json`에 동일 키 추가 (영문)**

`src/i18n/locales/en.json`에서 동일 위치를 찾아 추가:

`milestones.option`:
```json
"premium_humanity": "Share of Humanity",
"premium_earth_area": "Share of Earth",
"premium_calendar": "Calendar Drifter",
"premium_flag_palette": "Flag Palette Master",
"premium_un_linguist": "UN Linguist",
"premium_age_match": "Age Match",
"premium_round_the_clock": "Round the Clock"
```

`milestones.activeNext`:
```json
"months": "Visit {{count}} more months to earn <b>{{title}}</b>",
"colors": "Collect {{count}} more colors to earn <b>{{title}}</b>",
"languages": "Add {{count}} more UN languages to earn <b>{{title}}</b>",
"percent": "{{count}}% more to earn <b>{{title}}</b>",
"hours": "{{count}} more hours of timezone spread to earn <b>{{title}}</b>",
"needsBirth": "Set your birthday in your profile to see progress",
"needsHomeCountry": "Set your home country to see progress"
```

`milestones.premium.subsectionUnsupported`: `"Earned automatically when achieved"`

`home`:
```json
"monthsUnit": " months",
"colorsUnit": " colors",
"languagesUnit": " languages",
"percentUnit": "%",
"hoursUnit": " hours"
```

`home.milestoneFooter`:
```json
"months": "{{count}} more months to <b>{{title}}</b>",
"colors": "{{count}} more colors to <b>{{title}}</b>",
"languages": "{{count}} more languages to <b>{{title}}</b>",
"percent": "{{count}}% more to <b>{{title}}</b>",
"hours": "{{count}} more hours to <b>{{title}}</b>",
"needsBirth": "Set your birthday in profile",
"needsHomeCountry": "Set your home country"
```

- [ ] **Step 6: 양 파일 JSON 유효성 확인**

Run: `python3 -c "import json; json.load(open('src/i18n/locales/ko.json')); json.load(open('src/i18n/locales/en.json')); print('OK')"`
Expected: `OK`.

- [ ] **Step 7: Commit**

```bash
git add src/i18n/locales/ko.json src/i18n/locales/en.json
git commit -m "feat(i18n): premium 마일스톤 진행률·footer 키 추가 (ko/en)"
```

---

### Task 9: 나머지 8개 로케일에 동일 키 추가 (en 값 복제)

**Files:**
- Modify: `src/i18n/locales/{de,es,fr,it,ja,ru,zh-CN,zh-TW}.json`

- [ ] **Step 1: 각 로케일에 영문 fallback 추가**

8개 로케일 각각에 대해 `en.json`에 추가한 동일 키를 추가하되, 값은 `en.json`과 동일한 영문으로 둔다 (i18n 키 누락 시 키 자체가 노출되는 것보다 영문 노출이 낫다). 추후 번역가가 채울 수 있다.

각 파일에 동일하게 추가할 항목:
- `milestones.option.premium_*` 7개
- `milestones.activeNext.{months,colors,languages,percent,hours,needsBirth,needsHomeCountry}` 7개
- `milestones.premium.subsectionUnsupported` 1개
- `home.{months,colors,languages,percent,hours}Unit` 5개
- `home.milestoneFooter.{months,colors,languages,percent,hours,needsBirth,needsHomeCountry}` 7개

- [ ] **Step 2: JSON 유효성 일괄 확인**

Run:
```bash
for f in src/i18n/locales/*.json; do
  python3 -c "import json,sys; json.load(open('$f'))" && echo "OK $f" || echo "FAIL $f"
done
```
Expected: 모두 OK.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/{de,es,fr,it,ja,ru,zh-CN,zh-TW}.json
git commit -m "i18n: premium 마일스톤 키를 8개 로케일에 영문 fallback으로 추가"
```

---

## Phase 5 — UI 변경

### Task 10: `MilestoneRow`의 `ActiveDescription`/`renderDescription`/`progressText` 분기 확장

**Files:**
- Modify: `src/screens/MilestonesScreen/MilestoneRow.tsx`

- [ ] **Step 1: `ActiveDescription` 타입 확장**

`src/screens/MilestonesScreen/MilestoneRow.tsx:14-22`:
```ts
import type { MilestoneProgress, MilestoneUnit } from "../../features/milestone/milestoneTypes";

export type ActiveDescription =
  | { kind: "completed" }
  | { kind: "needsBirth" }
  | { kind: "needsHomeCountry" }
  | {
      kind: "next";
      count: number;
      title: string;
      unit: MilestoneUnit;
    };
```

- [ ] **Step 2: `progressText` 계산을 단위 매핑으로 확장**

`src/screens/MilestonesScreen/MilestoneRow.tsx:44-53`의 progressText 계산을 다음으로 교체:
```ts
const UNIT_I18N_KEY: Record<MilestoneUnit, string> = {
  countries: "home.countriesUnit",
  days: "home.daysUnit",
  months: "home.monthsUnit",
  colors: "home.colorsUnit",
  languages: "home.languagesUnit",
  percent: "home.percentUnit",
  hours: "home.hoursUnit",
};

const progressText = progress.unsupportedReason
  ? "—"
  : progress.reachedFinal
    ? t("milestones.preview.completed")
    : t("milestones.preview.progress", {
        current: progress.current,
        next: progress.next,
        unit: t(UNIT_I18N_KEY[progress.unit]),
      });
```

- [ ] **Step 3: `renderDescription`에 새 케이스 추가**

`src/screens/MilestonesScreen/MilestoneRow.tsx:88-113`의 `renderDescription`을 다음으로 교체:
```ts
function renderDescription(
  desc: ActiveDescription,
  styles: ReturnType<typeof makeStyles>
) {
  if (desc.kind === "completed") {
    return (
      <Text style={[styles.rowDescription, styles.rowDescriptionDone]}>
        <Trans i18nKey="milestones.activeNext.completed" />
      </Text>
    );
  }
  if (desc.kind === "needsBirth") {
    return (
      <Text style={styles.rowDescription}>
        <Trans i18nKey="milestones.activeNext.needsBirth" />
      </Text>
    );
  }
  if (desc.kind === "needsHomeCountry") {
    return (
      <Text style={styles.rowDescription}>
        <Trans i18nKey="milestones.activeNext.needsHomeCountry" />
      </Text>
    );
  }
  // desc.kind === "next"
  const i18nKey: Record<MilestoneUnit, string> = {
    countries: "milestones.activeNext.countries",
    days: "milestones.activeNext.days",
    months: "milestones.activeNext.months",
    colors: "milestones.activeNext.colors",
    languages: "milestones.activeNext.languages",
    percent: "milestones.activeNext.percent",
    hours: "milestones.activeNext.hours",
  };
  return (
    <Text style={styles.rowDescription}>
      <Trans
        i18nKey={i18nKey[desc.unit]}
        values={{ count: desc.count, title: desc.title }}
        components={{ b: <Text style={styles.rowDescriptionBold} /> }}
      />
    </Text>
  );
}
```

- [ ] **Step 4: 컴파일**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/screens/MilestonesScreen/MilestoneRow.tsx
git commit -m "feat(milestones): MilestoneRow에 새 unit 5종·unsupported 분기 추가"
```

---

### Task 11: `MilestonesScreen`의 `buildActiveDescription` 확장

**Files:**
- Modify: `src/screens/MilestonesScreen.tsx:94-105`

- [ ] **Step 1: `buildActiveDescription`에 새 분기 추가**

`src/screens/MilestonesScreen.tsx:94-105`를 다음으로 교체:
```ts
function buildActiveDescription(
  progress: MilestoneProgress,
  t: ReturnType<typeof useTranslation>["t"]
): ActiveDescription | null {
  if (progress.unsupportedReason === "needs_birth") return { kind: "needsBirth" };
  if (progress.unsupportedReason === "needs_home_country") return { kind: "needsHomeCountry" };
  if (progress.reachedFinal) return { kind: "completed" };
  const next = progress.next;
  const badgeId = progress.nextTitleBadgeId;
  if (next == null || badgeId == null) return null;
  const badge = badgeFromId(badgeId, COUNTRY_NAME_KO_BY_CODE);
  const title = badge ? localizedBadgeTitle(badge, t, getCurrentLocale()) : "";
  // 진행률 안내는 "남은 양"으로 표시 (next - current)
  const count = Math.max(0, next - progress.current);
  return { kind: "next", count, title, unit: progress.unit };
}
```

(기존: `count: next` — 이는 "N개 도달 시 ...". 변경: `count: next - current` — 이는 "N개 더 필요". 무료 마일스톤도 동일하게 동작; 기존 i18n 메시지는 "{{count}}개국을 여행하면 ..." 이라 변경 시 의미가 약간 달라짐.)

> 주의: 기존 무료 마일스톤 i18n 문구가 "{{count}}개국을 여행하면 ..." 형태로 "총 N개국 도달"을 의미한다. premium은 "더 N개" 의미. 이 차이를 통일해야 한다.
>
> **결정: 기존 무료 마일스톤 문구를 그대로 유지하기 위해 `count`는 `next` (도달 목표값)로 유지하고, premium 활성 안내 문구도 동일하게 "도달 시" 의미로 작성. 이미 Task 8에서 그렇게 작성됨 (예: `percent: "{{count}}% 더 채우면 ..."`).**
>
> 따라서 위 코드의 `count: Math.max(0, next - progress.current)` 부분은 **사용하지 말고, 기존처럼 `count: next`로 유지**한다. 다음으로 교체:

```ts
function buildActiveDescription(
  progress: MilestoneProgress,
  t: ReturnType<typeof useTranslation>["t"]
): ActiveDescription | null {
  if (progress.unsupportedReason === "needs_birth") return { kind: "needsBirth" };
  if (progress.unsupportedReason === "needs_home_country") return { kind: "needsHomeCountry" };
  if (progress.reachedFinal) return { kind: "completed" };
  const next = progress.next;
  const badgeId = progress.nextTitleBadgeId;
  if (next == null || badgeId == null) return null;
  const badge = badgeFromId(badgeId, COUNTRY_NAME_KO_BY_CODE);
  const title = badge ? localizedBadgeTitle(badge, t, getCurrentLocale()) : "";
  return { kind: "next", count: next, title, unit: progress.unit };
}
```

i18n 문구도 이에 맞춰 통일하기 위해 Task 8에서 작성한 `activeNext.{months,colors,languages,percent,hours}` 메시지를 다음 형태로 통일하라:

- `months`: `{{count}}개월을 채우면 <b>{{title}}</b> 호칭을 얻습니다`
- `colors`: `{{count}}색을 모으면 <b>{{title}}</b> 호칭을 얻습니다`
- `languages`: `공용어 {{count}}개를 모으면 <b>{{title}}</b> 호칭을 얻습니다`
- `percent`: `{{count}}%에 도달하면 <b>{{title}}</b> 호칭을 얻습니다`
- `hours`: `시차 {{count}}시간에 도달하면 <b>{{title}}</b> 호칭을 얻습니다`

(영문도 동일 의미로 정정 — Task 8 commit 직후 follow-up commit으로 정정하거나, Task 8 작업 시 이 형태로 작성한다.)

> Task 8의 최종 i18n 문구는 위 통일 형태를 따른다. (Task 8/9 진행 중 이 변경을 반영할 것.)

- [ ] **Step 2: 컴파일**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/screens/MilestonesScreen.tsx
git commit -m "feat(milestones): buildActiveDescription에 unsupported 분기 추가"
```

---

### Task 12: `PremiumSection` 분리 — `PremiumLockedSection` 신규 파일

**Files:**
- Create: `src/screens/MilestonesScreen/PremiumLockedSection.tsx`
- Modify: `src/screens/MilestonesScreen.tsx` (import 변경)

- [ ] **Step 1: `PremiumLockedSection.tsx` 생성**

기존 `src/screens/MilestonesScreen/PremiumSection.tsx`의 전체 내용을 그대로 복사하여 새 파일 `src/screens/MilestonesScreen/PremiumLockedSection.tsx`에 저장. 함수명/export 이름을 `PremiumSection` → `PremiumLockedSection`으로 변경:

```tsx
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ALL_PREMIUM_MILESTONE_KINDS } from "../../features/milestone/milestoneTypes";
import type { Theme } from "../../theme/theme";

import type { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
  onPressUpsell: () => void;
};

export default function PremiumLockedSection({ theme: _theme, styles, onPressUpsell }: Props) {
  const { t } = useTranslation();

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

(기존 `useEntitlementStore` 의존을 제거. 무료 사용자 전용이므로 isAllMilestoneVisible 체크 불필요.)

- [ ] **Step 2: 컴파일**

Run: `npx tsc --noEmit`
Expected: PASS (PremiumSection은 아직 존재).

- [ ] **Step 3: Commit (분리 단계만)**

```bash
git add src/screens/MilestonesScreen/PremiumLockedSection.tsx
git commit -m "refactor(milestones): PremiumSection을 PremiumLockedSection으로 분리 (무료 전용)"
```

---

### Task 13: `PremiumUnlockedSection` 신규 작성 (유료 사용자 전용)

**Files:**
- Create: `src/screens/MilestonesScreen/PremiumUnlockedSection.tsx`

- [ ] **Step 1: 새 컴포넌트 작성**

`src/screens/MilestonesScreen/PremiumUnlockedSection.tsx`:

```tsx
import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  ALL_PREMIUM_MILESTONE_KINDS,
  MilestoneKind,
  MilestoneProgress,
} from "../../features/milestone/milestoneTypes";
import type { Theme } from "../../theme/theme";

import MilestoneRow, { ActiveDescription } from "./MilestoneRow";
import type { makeStyles } from "./styles";

/** 단계 1에서 대표 마일스톤 후보로 노출하는 7종 (spec 기반) */
const SELECTABLE_PREMIUM_KINDS: readonly MilestoneKind[] = [
  "premium_humanity",
  "premium_earth_area",
  "premium_calendar",
  "premium_flag_palette",
  "premium_un_linguist",
  "premium_age_match",
  "premium_round_the_clock",
];

/** 단계 1에서는 카드 형태로만 표시하는 3종 */
const INFO_ONLY_PREMIUM_KINDS = ALL_PREMIUM_MILESTONE_KINDS.filter(
  (k) => !SELECTABLE_PREMIUM_KINDS.includes(k as MilestoneKind)
);

type RowData = {
  kind: MilestoneKind;
  label: string;
  progress: MilestoneProgress;
  activeDescription: ActiveDescription | null;
};

type Props = {
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
  selectedKind: MilestoneKind;
  rows: RowData[];           // SELECTABLE_PREMIUM_KINDS만 포함
  onPick: (k: MilestoneKind) => void;
};

export default function PremiumUnlockedSection({
  theme: _theme,
  styles,
  selectedKind,
  rows,
  onPick,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.premiumSection}>
      <View style={styles.premiumHeader}>
        <Text style={styles.premiumTitle}>
          {t("milestones.premium.sectionTitle")} ({ALL_PREMIUM_MILESTONE_KINDS.length})
        </Text>
      </View>
      {rows.map((row) => (
        <MilestoneRow
          key={row.kind}
          theme={_theme}
          label={row.label}
          progress={row.progress}
          active={selectedKind === row.kind}
          activeDescription={row.activeDescription}
          onPress={() => onPick(row.kind)}
        />
      ))}
      {INFO_ONLY_PREMIUM_KINDS.map((id) => (
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
            <Text style={styles.premiumDescription}>
              {t("milestones.premium.subsectionUnsupported")}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export { SELECTABLE_PREMIUM_KINDS };
```

- [ ] **Step 2: 컴파일**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/screens/MilestonesScreen/PremiumUnlockedSection.tsx
git commit -m "feat(milestones): PremiumUnlockedSection (유료자: 7종 row + 3종 정보 카드)"
```

---

### Task 14: `MilestonesScreen.tsx`에서 분기 + 기존 PremiumSection 제거

**Files:**
- Modify: `src/screens/MilestonesScreen.tsx`
- Delete: `src/screens/MilestonesScreen/PremiumSection.tsx`

- [ ] **Step 1: `MilestonesScreen.tsx` 전체 수정**

`src/screens/MilestonesScreen.tsx` 상단 import에서 `PremiumSection` 제거하고 두 새 컴포넌트 추가:

```ts
import { useEntitlementStore } from "../features/entitlement/entitlementStore";
import { useVisitStore } from "../features/travel/visitStore";

import PremiumLockedSection from "./MilestonesScreen/PremiumLockedSection";
import PremiumUnlockedSection, {
  SELECTABLE_PREMIUM_KINDS,
} from "./MilestonesScreen/PremiumUnlockedSection";
```

(기존 `import PremiumSection from "./MilestonesScreen/PremiumSection";` 줄 삭제.)

본문 함수에서 `isAllMilestoneVisible` 추가:
```ts
const isAllMilestoneVisible = useEntitlementStore((s) => s.isAllMilestoneVisible);
```

`rows` 계산을 두 그룹으로 분리:

```ts
const baseRows = useMemo(() => {
  return ALL_MILESTONE_KINDS.map((k) => {
    const progress = evaluateMilestone(k, { visitCounts, premiumContext });
    return {
      kind: k,
      label: t(`milestones.option.${k}`),
      progress,
      activeDescription: buildActiveDescription(progress, t),
    };
  });
}, [t, visitCounts, premiumContext]);

const premiumRows = useMemo(() => {
  if (!isAllMilestoneVisible) return [];
  return SELECTABLE_PREMIUM_KINDS.map((k) => {
    const progress = evaluateMilestone(k, { visitCounts, premiumContext });
    return {
      kind: k,
      label: t(`milestones.option.${k}`),
      progress,
      activeDescription: buildActiveDescription(progress, t),
    };
  });
}, [isAllMilestoneVisible, t, visitCounts, premiumContext]);
```

기존 `rows` 변수를 위 두 변수로 대체. 렌더링 부분(70-87)을 다음으로 교체:

```tsx
<ScrollView contentContainerStyle={styles.content}>
  {baseRows.map((row) => (
    <MilestoneRow
      key={row.kind}
      theme={theme}
      label={row.label}
      progress={row.progress}
      active={kind === row.kind}
      activeDescription={row.activeDescription}
      onPress={() => handlePick(row.kind)}
    />
  ))}
  {isAllMilestoneVisible ? (
    <PremiumUnlockedSection
      theme={theme}
      styles={styles}
      selectedKind={kind}
      rows={premiumRows}
      onPick={handlePick}
    />
  ) : (
    <PremiumLockedSection
      theme={theme}
      styles={styles}
      onPressUpsell={() => {
        Alert.alert(t("milestones.premium.ctaUnlock"));
      }}
    />
  )}
  <Text style={styles.footnote}>{t("milestones.footnote")}</Text>
</ScrollView>
```

- [ ] **Step 2: 기존 `PremiumSection.tsx` 삭제**

Run: `rm src/screens/MilestonesScreen/PremiumSection.tsx`

- [ ] **Step 3: 컴파일**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A src/screens/MilestonesScreen.tsx src/screens/MilestonesScreen/PremiumSection.tsx
git commit -m "feat(milestones): isAllMilestoneVisible 분기 + 기존 PremiumSection 제거"
```

---

### Task 15: `MainScreen`의 `MilestoneFooterText` 새 unit / unsupported 분기

**Files:**
- Modify: `src/screens/MainScreen/MilestoneFooterText.tsx`

- [ ] **Step 1: 컴포넌트 전체 교체**

```tsx
import { Text, type TextStyle, type StyleProp } from "react-native";
import { useTranslation } from "react-i18next";

import type {
  MilestoneProgress,
  MilestoneUnit,
} from "../../features/milestone/milestoneTypes";

const TITLE_MARKER = "\x00__TITLE__\x00";

const FOOTER_KEY: Record<MilestoneUnit, string> = {
  countries: "home.milestoneFooter.countries",
  days: "home.milestoneFooter.days",
  months: "home.milestoneFooter.months",
  colors: "home.milestoneFooter.colors",
  languages: "home.milestoneFooter.languages",
  percent: "home.milestoneFooter.percent",
  hours: "home.milestoneFooter.hours",
};

interface Props {
  progress: MilestoneProgress;
  nextTitleLabel: string;
  strongStyle: StyleProp<TextStyle>;
}

export function MilestoneFooterText({
  progress,
  nextTitleLabel,
  strongStyle,
}: Props) {
  const { t } = useTranslation();

  if (progress.unsupportedReason === "needs_birth") {
    return <>{t("home.milestoneFooter.needsBirth")}</>;
  }
  if (progress.unsupportedReason === "needs_home_country") {
    return <>{t("home.milestoneFooter.needsHomeCountry")}</>;
  }
  if (progress.reachedFinal) {
    return <>{t("home.milestoneFooter.completed")}</>;
  }

  const remaining = (progress.next ?? 0) - progress.current;
  const message = t(FOOTER_KEY[progress.unit], {
    count: remaining,
    title: TITLE_MARKER,
  });
  const [pre, post = ""] = message.split(TITLE_MARKER);

  return (
    <>
      {pre}
      <Text style={strongStyle}>{nextTitleLabel}</Text>
      {post}
    </>
  );
}
```

- [ ] **Step 2: 컴파일**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/screens/MainScreen/MilestoneFooterText.tsx
git commit -m "feat(home): MilestoneFooterText에 새 unit·unsupported 분기"
```

---

### Task 16: `MainScreen`의 진행률 숫자 표시에 unsupported 가드

**Files:**
- Modify: `src/screens/MainScreen/index.tsx:483-501`

- [ ] **Step 1: 진행률 숫자/바 부분에 unsupported 분기**

`src/screens/MainScreen/index.tsx:483-501` 부근의 `<View style={styles.statBigRow}>` 부분을 다음으로 교체:

```tsx
{milestoneProgress.unsupportedReason ? (
  <View style={styles.statBigRow}>
    <Text style={styles.statBigDenom}>—</Text>
  </View>
) : (
  <>
    <View style={styles.statBigRow}>
      <Text style={styles.statBigNum}>{milestoneProgress.current}</Text>
      <Text style={styles.statBigDenom}>
        {milestoneProgress.next != null
          ? ` / ${milestoneProgress.next}`
          : ""}
      </Text>
      <Text style={styles.statBigPercent}>
        {"  "}{milestoneProgress.percent}%
      </Text>
    </View>
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          { width: `${milestoneProgress.percent}%` },
        ]}
      />
    </View>
  </>
)}
```

- [ ] **Step 2: 컴파일**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/screens/MainScreen/index.tsx
git commit -m "feat(home): 진행률 표시에 unsupported 가드 추가"
```

---

## Phase 6 — 회귀 검증 + QA

### Task 17: 전체 테스트 + 타입 검증

**Files:** N/A (검증 단계)

- [ ] **Step 1: TypeScript 전체 컴파일**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 2: Jest 전체 테스트**

Run: `npx jest`
Expected: 모든 기존 + 신규 테스트 PASS.

- [ ] **Step 3: i18n 키 무결성 — `en.json` 기준 누락 키 확인**

Run:
```bash
node -e "
const en = Object.keys(require('./src/i18n/locales/en.json'));
for (const f of ['ko','de','es','fr','it','ja','ru','zh-CN','zh-TW']) {
  const l = require('./src/i18n/locales/' + f + '.json');
  const enFlat = require('./src/i18n/locales/en.json');
  function flat(o, prefix = '') {
    return Object.entries(o).flatMap(([k,v]) =>
      typeof v === 'object' && v != null
        ? flat(v, prefix + k + '.')
        : [prefix + k]
    );
  }
  const enKeys = new Set(flat(enFlat));
  const lKeys = new Set(flat(l));
  const missing = [...enKeys].filter(k => !lKeys.has(k));
  if (missing.length) console.log(f, missing);
  else console.log(f, 'OK');
}
"
```
Expected: 모든 로케일 `OK`.

- [ ] **Step 4: 수동 QA 체크리스트 (실기기/시뮬레이터)**

다음 시나리오를 사용자가 직접 확인:

**무료 사용자**:
- [ ] MilestonesScreen → premium 섹션은 잠금 카드 10종 + Unlock CTA 표시 (회귀 없음)
- [ ] 무료 마일스톤 row 선택 시 정상 동작 (회귀 없음)

**유료 사용자**:
- [ ] MilestonesScreen → 무료 7종 row 다음에 "Premium" 헤더 + 7종 row + 3종 정보 카드(자물쇠 없음, 캡션 표시)
- [ ] 7종 row 라디오 클릭 시 `setKind` 호출되어 활성 표시 변경
- [ ] active premium row의 진행률 / 다음 호칭 안내가 단위별로 정확히 표시됨
- [ ] 3종 정보 카드는 클릭 불가, "달성 시 호칭이 자동 부여됩니다" 캡션 표시
- [ ] MainScreen에서 선택된 premium kind의 진행률이 표시되고 footer 메시지가 단위에 맞춤
- [ ] `age_match` 선택 시 birth 미설정 사용자에게 "프로필에 생일을 입력해주세요" 안내
- [ ] `calendar` 선택 시 본국 미설정 사용자에게 "본국을 설정해주세요" 안내
- [ ] 앱 재시작 시 premium kind가 복원됨

- [ ] **Step 5: Final commit (verification done)**

테스트가 모두 통과하면 추가 commit 불필요. QA 결과를 PR 설명에 첨부.

---

## Self-Review

### Spec coverage 확인

| Spec 섹션 | 대응 Task |
|---|---|
| 데이터 모델: `unit` 5종 추가 | Task 1 |
| 데이터 모델: `unsupportedReason` 추가 | Task 1 |
| `evaluateMilestone` 시그니처 확장 | Task 2 |
| `evaluatePremiumProgress` 모듈 분리 | Task 3-5 |
| 7종 평가 로직 (humanity ~ round_the_clock) | Task 3-5 |
| 엣지 케이스 (age_match birth/calendar home) | Task 4-5 (테스트 + 구현) |
| `visitStore.premiumContext` 캐시 | Task 6 |
| 호출부 컨텍스트 전달 | Task 7 |
| `MilestoneRow.ActiveDescription` 확장 | Task 10 |
| `renderDescription` 단위별 분기 | Task 10 |
| `progressText` unsupported 가드 | Task 10 |
| `buildActiveDescription` 확장 | Task 11 |
| `PremiumLockedSection` 신규 | Task 12 |
| `PremiumUnlockedSection` 신규 | Task 13 |
| `MilestonesScreen` 분기 | Task 14 |
| `MilestoneFooterText` 단위/unsupported (spec 비범위였으나 정합성 위해 포함) | Task 15 |
| `MainScreen` 진행률 unsupported 가드 (spec 비범위였으나 정합성 위해 포함) | Task 16 |
| i18n 키 27개 × 10 로케일 | Task 8-9 |
| 신규 테스트 (`evaluatePremiumProgress.test.ts`) | Task 3-5 |
| 회귀 테스트 PASS | Task 17 |

### 발견된 spec 보완 사항

- `MilestoneFooterText`와 `MainScreen` 진행률 표시도 함께 손봐야 정합성이 유지된다 (spec에서는 비범위로 기술됨). Task 15-16에 포함.
- i18n 키에 `home.milestoneFooter.{months,colors,languages,percent,hours,needsBirth,needsHomeCountry}` 7종이 추가로 필요하다 (spec의 27개에는 footer 7개가 누락되어 있어 실제로는 27개 + 7개 = 34개?). Task 8 본문은 footer 키도 포함해 작성됨 — 총 27개 표기는 spec 시점 추정치, 실제 추가량은 footer 포함 30+개.
- `INFO_ONLY_PREMIUM_KINDS` (범위 외 3종)는 `n_before_n`, `decade_stamps`, `four_seasons`. `ALL_PREMIUM_MILESTONE_KINDS`에서 `SELECTABLE_PREMIUM_KINDS`를 제외해 자동 도출 (Task 13).

### Type consistency 확인

- `MilestoneUnit` 타입을 `milestoneTypes.ts`에서 export → 모든 파일에서 동일하게 import.
- `MilestoneEvalContext`는 `milestoneEvaluator.ts`에서 export → 호출부(`MilestonesScreen`, `MainScreen`)에서 직접 사용은 불필요(인라인 객체 리터럴로 전달).
- `ActiveDescription`은 `MilestoneRow.tsx`에서 export → `MilestonesScreen.tsx`/`PremiumUnlockedSection.tsx`에서 import.
- `PremiumContext`는 `premium/types.ts`에서 export → `milestoneEvaluator.ts`, `evaluatePremiumProgress.ts`, `visitStore.ts` 모두 동일 import.

---

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-05-09-premium-milestone-selectable.md`.

이어서 구현으로 진행합니다.
