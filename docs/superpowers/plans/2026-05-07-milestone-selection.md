# 목표 마일스톤 선택 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 홈 화면 마일스톤 컴포넌트의 진행 기준을 7개 옵션(국가 수 / 누적 일수 / 5개 대륙 전문가) 중 하나로 선택할 수 있게 한다. 호칭 선택과는 독립.

**Architecture:**
1. `src/features/milestone/` 신규 도메인 모듈 — 타입·평가·저장·zustand 스토어를 책임별로 분리.
2. 신규 `MilestonesScreen`(라우트 추가) + 기존 `MainScreen` `statCard`를 마일스톤 평가 결과로 구동.
3. `continents.ts`에 `initiate` 단계를 추가하고 호칭 시스템(`badges.ts`/`badgeI18n.ts`)에 입문 호칭을 새로 emit.

**Tech Stack:** React Native (Expo 54) · TypeScript · zustand · @react-native-async-storage/async-storage · react-i18next · @react-navigation/native-stack. **테스트 라이브러리는 도입되어 있지 않다** — 이 계획은 TDD 대신 `npx tsc --noEmit` 타입 검사 + 수동 화면 검증을 사용한다.

**관련 설계 문서:** [`docs/superpowers/specs/2026-05-07-milestone-selection-design.md`](../specs/2026-05-07-milestone-selection-design.md)

---

## 작업 흐름 일반 규칙

- 각 Task 끝에 git commit. 메시지는 영어 prefix + 한국어 본문 (기존 커밋 컨벤션 준수: `feat(milestone): …`, `tweak(home): …` 등).
- 코드 변경 후 항상 `npx tsc --noEmit` 통과 확인.
- 파일 분리는 CLAUDE.md §5("Split Files Aggressively")를 따른다.
- 일러두기: 다른 locale(de/es/fr/it/ja/ru/zh-CN/zh-TW)은 영어 fallback에 의존하므로 ko/en 파일에만 키 추가, 나머지는 손대지 않는다(번역은 별도 작업).

---

## Task 1: 마일스톤 도메인 타입 정의

**Files:**
- Create: `src/features/milestone/milestoneTypes.ts`

- [ ] **Step 1.1: 타입 파일 작성**

```ts
// src/features/milestone/milestoneTypes.ts
// 사용자가 홈 화면에서 추적할 "목표 마일스톤" 도메인 타입.
// 종류는 7개 — 국가 수 / 누적 일수 / 5개 대륙 전문가.
// 호칭(Badge) 시스템과 독립적으로 진행률만 다룬다.

export type ContinentMilestoneId =
  | "continent_AS"
  | "continent_EU"
  | "continent_SA"
  | "continent_AF"
  | "continent_NA";

export type MilestoneKind = "countries" | "days" | ContinentMilestoneId;

export const ALL_MILESTONE_KINDS: readonly MilestoneKind[] = [
  "countries",
  "days",
  "continent_AS",
  "continent_EU",
  "continent_SA",
  "continent_AF",
  "continent_NA",
];

export const DEFAULT_MILESTONE_KIND: MilestoneKind = "countries";

/** UI에서 진행률·다음 단계를 그리기 위한 평가 결과 */
export type MilestoneProgress = {
  kind: MilestoneKind;
  /** 현재 값 (방문 국가 수 / 누적 일수 / 해당 대륙 방문 국가 수) */
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
  unit: "countries" | "days";
};

export function isMilestoneKind(value: unknown): value is MilestoneKind {
  return (
    typeof value === "string" &&
    (ALL_MILESTONE_KINDS as readonly string[]).includes(value)
  );
}
```

- [ ] **Step 1.2: 타입 검사**

Run: `npx tsc --noEmit`
Expected: PASS (변경 없음)

- [ ] **Step 1.3: Commit**

```bash
git add src/features/milestone/milestoneTypes.ts
git commit -m "feat(milestone): MilestoneKind / MilestoneProgress 타입 정의"
```

---

## Task 2: 대륙 입문 단계 컷오프 추가 (`continents.ts`)

**Files:**
- Modify: `src/features/badges/continents.ts`

- [ ] **Step 2.1: `ContinentDefinition`에 `initiate` 필드 추가하고 모든 대륙에 값 채우기**

`src/features/badges/continents.ts` 수정 — 기존 `wanderer/conqueror` 사이에 `initiate`를 추가.

```ts
export type ContinentDefinition = {
  id: ContinentId;
  nameKo: string;
  nameEn: string;
  /** 입문 컷오프 — 마일스톤 추가로 도입 (2026-05-07). AN은 입문 단계 없음(호환 위해 conqueror와 동일). */
  initiate: number;
  /** 탐방가 컷오프 */
  wanderer: number;
  /** 정복자 컷오프 */
  conqueror: number;
};

export const CONTINENTS: readonly ContinentDefinition[] = [
  { id: "AS", nameKo: "아시아", nameEn: "Asia", initiate: 2, wanderer: 5, conqueror: 12 },
  { id: "EU", nameKo: "유럽", nameEn: "Europe", initiate: 2, wanderer: 5, conqueror: 15 },
  { id: "AF", nameKo: "아프리카", nameEn: "Africa", initiate: 2, wanderer: 4, conqueror: 10 },
  { id: "NA", nameKo: "북아메리카", nameEn: "North America", initiate: 1, wanderer: 3, conqueror: 8 },
  { id: "SA", nameKo: "남아메리카", nameEn: "South America", initiate: 1, wanderer: 3, conqueror: 7 },
  { id: "OC", nameKo: "오세아니아", nameEn: "Oceania", initiate: 1, wanderer: 2, conqueror: 5 },
  // 남극: 입문 단계 없음. wanderer/conqueror 그대로 1.
  { id: "AN", nameKo: "남극", nameEn: "Antarctica", initiate: 1, wanderer: 1, conqueror: 1 },
];
```

(나머지 export — `ASIA/EUROPE/...`, `CONTINENT_BY_CODE`, `continentOf`, `continentDefinition` — 변경 없음.)

- [ ] **Step 2.2: 타입 검사**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 2.3: Commit**

```bash
git add src/features/badges/continents.ts
git commit -m "feat(badges): 대륙 정의에 입문(initiate) 단계 컷오프 추가"
```

---

## Task 3: 대륙 입문 호칭 추가 (`badges.ts`)

**Files:**
- Modify: `src/features/badges/badges.ts`

- [ ] **Step 3.1: `continentBadge` 시그니처 확장 + 입문 분기**

`src/features/badges/badges.ts`의 `continentBadge` 함수를 다음과 같이 교체. AN은 기존 `pioneer` 분기를 유지하고, `initiate/wanderer/conqueror` 3종은 일반 대륙 분기로 처리한다.

```ts
function continentBadge(
  continent: ContinentId,
  kind: "initiate" | "wanderer" | "conqueror"
): BadgeDefinition {
  const def = continentDefinition(continent);
  if (continent === "AN") {
    // 남극: 입문 단계 미적용 — 기존 pioneer 호칭 그대로 emit.
    return {
      id: `continent_AN_pioneer`,
      category: "continent",
      titleKo: "남극 탐험가",
      titleEn: "Antarctica Pioneer",
      description: "지구 최남단까지 발자취를 남긴 사람",
      emoji: "🐧",
      rank: 30,
    };
  }
  if (kind === "initiate") {
    return {
      id: `continent_${continent}_initiate`,
      category: "continent",
      titleKo: `${def.nameKo} 여행자`,
      titleEn: `${def.nameEn} Traveler`,
      description: `${def.nameKo}에서 ${def.initiate}개국 이상 방문`,
      emoji: emojiForContinent(continent),
      rank: 18,
    };
  }
  if (kind === "wanderer") {
    return {
      id: `continent_${continent}_wanderer`,
      category: "continent",
      titleKo: `${def.nameKo} 탐방가`,
      titleEn: `${def.nameEn} Wanderer`,
      description: `${def.nameKo}에서 ${def.wanderer}개국 이상 방문`,
      emoji: emojiForContinent(continent),
      rank: 20,
    };
  }
  return {
    id: `continent_${continent}_conqueror`,
    category: "continent",
    titleKo: `${def.nameKo} 정복자`,
    titleEn: `${def.nameEn} Conqueror`,
    description: `${def.nameKo}에서 ${def.conqueror}개국 이상 방문`,
    emoji: emojiForContinent(continent),
    rank: 25,
  };
}
```

- [ ] **Step 3.2: `evaluateBadges`에 initiate 분기 추가**

`evaluateBadges` 내 대륙 처리 블록을 다음과 같이 교체:

```ts
  for (const cont of CONTINENTS) {
    const n = byContinent[cont.id];
    if (cont.id === "AN") {
      if (n >= 1) out.push(continentBadge("AN", "conqueror"));
      continue;
    }
    if (n >= cont.initiate) out.push(continentBadge(cont.id, "initiate"));
    if (n >= cont.wanderer) out.push(continentBadge(cont.id, "wanderer"));
    if (n >= cont.conqueror) out.push(continentBadge(cont.id, "conqueror"));
  }
```

- [ ] **Step 3.3: `badgeFromId` 정규식 확장**

`badgeFromId` 내 대륙 분기를 다음과 같이 교체:

```ts
  if (id.startsWith("continent_")) {
    const rest = id.slice(10);
    if (rest === "AN_pioneer") return continentBadge("AN", "conqueror");
    const m = rest.match(/^([A-Z]{2})_(initiate|wanderer|conqueror)$/);
    if (!m) return null;
    return continentBadge(
      m[1] as ContinentId,
      m[2] as "initiate" | "wanderer" | "conqueror"
    );
  }
```

- [ ] **Step 3.4: `getStaticBadgeCatalog`에 initiate 추가**

`getStaticBadgeCatalog` 내 대륙 블록을 다음과 같이 교체:

```ts
  for (const cont of CONTINENTS) {
    if (cont.id === "AN") {
      out.push(continentBadge("AN", "conqueror"));
    } else {
      out.push(continentBadge(cont.id, "initiate"));
      out.push(continentBadge(cont.id, "wanderer"));
      out.push(continentBadge(cont.id, "conqueror"));
    }
  }
```

- [ ] **Step 3.5: 타입 검사**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3.6: Commit**

```bash
git add src/features/badges/badges.ts
git commit -m "feat(badges): 대륙 입문(여행자) 호칭 단계 추가"
```

---

## Task 4: 대륙 입문 호칭 i18n 처리 (`badgeI18n.ts`)

**Files:**
- Modify: `src/features/badges/badgeI18n.ts`
- Modify: `src/i18n/locales/ko.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 4.1: `badgeI18n.ts`의 정규식과 분기 확장**

`localizedBadgeTitle` 내부의 대륙 매칭을 다음과 같이 교체:

```ts
  const continentMatch = badge.id.match(
    /^continent_([A-Z]{2})_(initiate|wanderer|conqueror)$/
  );
  if (continentMatch) {
    const continentId = continentMatch[1] as ContinentId;
    const continent = localizedContinentName(continentId, t);
    const stage = continentMatch[2] as "initiate" | "wanderer" | "conqueror";
    const key =
      stage === "initiate"
        ? "badges.continent.initiateTitle"
        : stage === "wanderer"
          ? "badges.continent.wandererTitle"
          : "badges.continent.conquerorTitle";
    return t(key, { continent, defaultValue: badge.titleKo });
  }
```

`localizedBadgeDescription` 내부의 대륙 매칭도 마찬가지로 확장:

```ts
  const continentMatch = badge.id.match(
    /^continent_([A-Z]{2})_(initiate|wanderer|conqueror)$/
  );
  if (continentMatch) {
    const continentId = continentMatch[1] as ContinentId;
    const continent = localizedContinentName(continentId, t);
    const def = CONTINENTS.find((c) => c.id === continentId);
    const stage = continentMatch[2] as "initiate" | "wanderer" | "conqueror";
    const count =
      stage === "initiate"
        ? def?.initiate
        : stage === "wanderer"
          ? def?.wanderer
          : def?.conqueror;
    const key =
      stage === "initiate"
        ? "badges.continent.initiateDescription"
        : stage === "wanderer"
          ? "badges.continent.wandererDescription"
          : "badges.continent.conquerorDescription";
    return t(key, {
      continent,
      count: count ?? 0,
      defaultValue: badge.description,
    });
  }
```

- [ ] **Step 4.2: ko.json에 입문 호칭 i18n 키 추가**

`src/i18n/locales/ko.json`의 `"badges": { "continent": { ... } }` 블록에서 기존 `"wandererTitle"` 항목 직전에 다음 두 줄 추가 (`,` 위치 주의):

```json
      "initiateTitle": "{{continent}} 여행자",
      "initiateDescription": "{{continent}}에서 {{count}}개국 이상 방문",
```

- [ ] **Step 4.3: en.json에 입문 호칭 i18n 키 추가**

`src/i18n/locales/en.json`의 `"badges": { "continent": { ... } }` 블록에 동일한 위치에 추가:

```json
      "initiateTitle": "{{continent}} Traveler",
      "initiateDescription": "Visited {{count}}+ countries in {{continent}}",
```

- [ ] **Step 4.4: 타입 검사**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4.5: Commit**

```bash
git add src/features/badges/badgeI18n.ts src/i18n/locales/ko.json src/i18n/locales/en.json
git commit -m "feat(i18n): 대륙 입문(여행자) 호칭 i18n 키 추가"
```

---

## Task 5: 마일스톤 저장(AsyncStorage) 모듈

**Files:**
- Create: `src/features/milestone/milestoneStorage.ts`

- [ ] **Step 5.1: 저장 모듈 작성**

`src/features/milestone/milestoneStorage.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

import { isMilestoneKind, MilestoneKind } from "./milestoneTypes";

const KIND_KEY = "visitgrid:milestone:kind";

export async function loadMilestoneKind(): Promise<MilestoneKind | null> {
  const v = await AsyncStorage.getItem(KIND_KEY);
  return isMilestoneKind(v) ? v : null;
}

export async function saveMilestoneKind(kind: MilestoneKind): Promise<void> {
  await AsyncStorage.setItem(KIND_KEY, kind);
}
```

- [ ] **Step 5.2: 타입 검사**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5.3: Commit**

```bash
git add src/features/milestone/milestoneStorage.ts
git commit -m "feat(milestone): AsyncStorage 기반 선택 저장 모듈 추가"
```

---

## Task 6: 마일스톤 평가 함수

**Files:**
- Create: `src/features/milestone/milestoneEvaluator.ts`

- [ ] **Step 6.1: 평가 함수 작성**

`src/features/milestone/milestoneEvaluator.ts`:

```ts
// 누적 visitCounts(전체 기간)로 마일스톤 진행 상태를 평가한다.
// 홈 상단 통계는 연도 필터(activeCounts)를 쓰지만, 마일스톤은 항상 누적이 자연스럽다.

import { CONTINENTS, ContinentId, continentOf } from "../badges/continents";
import { TIER_CUTOFFS, TIERS } from "../travel/tierTitles";
import {
  ContinentMilestoneId,
  MilestoneKind,
  MilestoneProgress,
} from "./milestoneTypes";

const DAY_CUTOFFS: readonly number[] = [7, 30, 100, 365, 730, 1000];

const CONTINENT_KIND_TO_ID: Record<ContinentMilestoneId, ContinentId> = {
  continent_AS: "AS",
  continent_EU: "EU",
  continent_SA: "SA",
  continent_AF: "AF",
  continent_NA: "NA",
};

function findNextCutoff(
  cutoffs: readonly number[],
  current: number
): number | null {
  for (const c of cutoffs) {
    if (c > current) return c;
  }
  return null;
}

function buildProgress(
  kind: MilestoneKind,
  current: number,
  next: number | null,
  nextTitleBadgeId: string | null,
  unit: "countries" | "days"
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
  };
}

export function evaluateMilestone(
  kind: MilestoneKind,
  visitCounts: Record<string, number>
): MilestoneProgress {
  if (kind === "countries") {
    const current = Object.keys(visitCounts).length;
    const next = findNextCutoff(TIER_CUTOFFS, current);
    const nextTier = next == null ? null : TIERS.find((t) => t.threshold === next);
    return buildProgress(
      kind,
      current,
      next,
      nextTier ? `tier_${nextTier.id}` : null,
      "countries"
    );
  }
  if (kind === "days") {
    let current = 0;
    for (const c of Object.keys(visitCounts)) current += visitCounts[c] ?? 0;
    const next = findNextCutoff(DAY_CUTOFFS, current);
    return buildProgress(
      kind,
      current,
      next,
      next == null ? null : `days_${next}`,
      "days"
    );
  }
  // 대륙 마일스톤
  const continentId = CONTINENT_KIND_TO_ID[kind];
  let current = 0;
  for (const code of Object.keys(visitCounts)) {
    if (continentOf(code) === continentId) current += 1;
  }
  const def = CONTINENTS.find((c) => c.id === continentId)!;
  const cutoffs = [def.initiate, def.wanderer, def.conqueror];
  const next = findNextCutoff(cutoffs, current);
  let nextTitleBadgeId: string | null = null;
  if (next != null) {
    if (next === def.initiate) nextTitleBadgeId = `continent_${continentId}_initiate`;
    else if (next === def.wanderer) nextTitleBadgeId = `continent_${continentId}_wanderer`;
    else nextTitleBadgeId = `continent_${continentId}_conqueror`;
  }
  return buildProgress(kind, current, next, nextTitleBadgeId, "countries");
}
```

- [ ] **Step 6.2: 타입 검사**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6.3: Commit**

```bash
git add src/features/milestone/milestoneEvaluator.ts
git commit -m "feat(milestone): 종류별 진행률 평가 함수 추가"
```

---

## Task 7: 마일스톤 zustand 스토어

**Files:**
- Create: `src/features/milestone/milestoneStore.ts`

- [ ] **Step 7.1: 스토어 작성**

`src/features/milestone/milestoneStore.ts`:

```ts
import { create } from "zustand";

import {
  loadMilestoneKind,
  saveMilestoneKind,
} from "./milestoneStorage";
import { DEFAULT_MILESTONE_KIND, MilestoneKind } from "./milestoneTypes";

type State = {
  kind: MilestoneKind;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setKind: (kind: MilestoneKind) => Promise<void>;
};

export const useMilestoneStore = create<State>((set) => ({
  kind: DEFAULT_MILESTONE_KIND,
  hydrated: false,

  hydrate: async () => {
    const stored = await loadMilestoneKind();
    set({ kind: stored ?? DEFAULT_MILESTONE_KIND, hydrated: true });
  },

  setKind: async (kind) => {
    set({ kind });
    await saveMilestoneKind(kind);
  },
}));
```

- [ ] **Step 7.2: 앱 부트 시 hydrate 연결**

`App.tsx`에서 다른 store들이 hydrate되는 위치를 찾아 동일하게 호출.

`grep -n "hydrate" /Users/ocean.view/dev/VisitGrid/.claude/worktrees/hopeful-chatelet-8f9289/App.tsx` 로 위치 확인 후, 기존 hydrate 호출 옆에 추가:

```ts
import { useMilestoneStore } from "./src/features/milestone/milestoneStore";

// (기존 hydrate 호출 모음 안에)
void useMilestoneStore.getState().hydrate();
```

(주의: badgeStore.hydrate()와 동일한 패턴으로 호출. App.tsx의 정확한 위치는 코드를 보고 결정.)

- [ ] **Step 7.3: 타입 검사**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7.4: Commit**

```bash
git add src/features/milestone/milestoneStore.ts App.tsx
git commit -m "feat(milestone): zustand 스토어 + 앱 부트 hydrate 연결"
```

---

## Task 8: 신규 라우트 `Milestones` 추가

**Files:**
- Modify: `src/navigation/types.ts`
- Modify: `src/navigation/RootNavigator.tsx`
- Create: `src/navigation/screens/MilestonesScreenNav.tsx`

- [ ] **Step 8.1: `RootStackParamList`에 라우트 추가**

`src/navigation/types.ts`에서 `Titles: undefined;` 직후에 `Milestones: undefined;`를 추가:

```ts
export type RootStackParamList = {
  Main: undefined;
  AddTrip: undefined;
  Settings: undefined;
  ChangeHome: undefined;
  Titles: undefined;
  Milestones: undefined;
  MapZoom: undefined;
  CountryDetail: undefined;
  TripDetail: { trip: RecentTrip };
  EditTrip: { trip: RecentTrip };
  History: undefined;
  ReviewSuspect: undefined;
  AllCountries: undefined;
  Language: undefined;
};
```

- [ ] **Step 8.2: nav wrapper 생성**

`src/navigation/screens/MilestonesScreenNav.tsx`:

```tsx
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import MilestonesScreen from "../../screens/MilestonesScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function MilestonesScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Milestones">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <MilestonesScreen
        onClose={() => navigation.goBack()}
        onOpenTitles={() => navigation.navigate("Titles")}
      />
    </>
  );
}
```

(`MilestonesScreen`은 Task 10에서 만든다. 이 단계에서는 일시적으로 import가 깨질 수 있다 — Task 10이 끝나기 전 commit하지 않는다.)

- [ ] **Step 8.3: `RootNavigator.tsx`에 스크린 등록 (Task 10 완료 후)**

`src/navigation/RootNavigator.tsx`에 import 및 스크린 추가:

```tsx
import MilestonesScreenNav from "./screens/MilestonesScreenNav";
// ...
        <Stack.Screen name="Titles" component={TitlesScreenNav} />
        <Stack.Screen name="Milestones" component={MilestonesScreenNav} />
```

- [ ] **Step 8.4: Task 8은 Task 10 완료 후 일괄 commit (자기 자신 단독 commit하지 않음)**

(연관 화면이 없으면 빌드가 깨지므로 의도적으로 분리. 구현 순서: Task 9 → 10 → 8.3 → 8.4 commit)

---

## Task 9: 마일스톤 화면 보조 컴포넌트 (`MilestoneRow`)

**Files:**
- Create: `src/screens/MilestonesScreen/styles.ts`
- Create: `src/screens/MilestonesScreen/MilestoneRow.tsx`

- [ ] **Step 9.1: 스타일 작성**

`src/screens/MilestonesScreen/styles.ts`:

```ts
import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 56,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerSide: { minWidth: 40 },
    title: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
    cancel: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: "600",
    },
    quickLink: {
      color: theme.accent,
      fontSize: 14,
      fontWeight: "600",
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 40,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 10,
    },
    rowActive: {
      borderColor: theme.accent,
      borderWidth: 2,
      backgroundColor: theme.selectedRowBg,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    radioActive: {
      borderColor: theme.accent,
      backgroundColor: theme.accent,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.radioCheckColor,
    },
    rowMain: { flex: 1 },
    rowLabel: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    rowSub: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    rowProgress: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    rowProgressDone: {
      color: theme.accent,
    },
  });
}
```

- [ ] **Step 9.2: `MilestoneRow` 작성**

`src/screens/MilestonesScreen/MilestoneRow.tsx`:

```tsx
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { MilestoneProgress } from "../../features/milestone/milestoneTypes";
import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  label: string;
  progress: MilestoneProgress;
  active: boolean;
  onPress: () => void;
};

export default function MilestoneRow({
  theme,
  label,
  progress,
  active,
  onPress,
}: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const progressText = progress.reachedFinal
    ? t("milestones.preview.completed")
    : t("milestones.preview.progress", {
        current: progress.current,
        next: progress.next,
        unit:
          progress.unit === "days"
            ? t("home.daysUnit")
            : t("home.countriesUnit"),
      });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        active && styles.rowActive,
        pressed && !active && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text
        style={[
          styles.rowProgress,
          progress.reachedFinal && styles.rowProgressDone,
        ]}
      >
        {progressText}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 9.3: 타입 검사**

Run: `npx tsc --noEmit`
Expected: PASS (Task 10 완료 전이라도 이 두 파일만으로는 통과)

- [ ] **Step 9.4: Commit**

```bash
git add src/screens/MilestonesScreen/
git commit -m "feat(milestone): MilestonesScreen 스타일 및 행 컴포넌트 추가"
```

---

## Task 10: `MilestonesScreen` 본체

**Files:**
- Create: `src/screens/MilestonesScreen.tsx`

- [ ] **Step 10.1: 화면 컴포넌트 작성**

`src/screens/MilestonesScreen.tsx`:

```tsx
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { evaluateMilestone } from "../features/milestone/milestoneEvaluator";
import { useMilestoneStore } from "../features/milestone/milestoneStore";
import {
  ALL_MILESTONE_KINDS,
  MilestoneKind,
} from "../features/milestone/milestoneTypes";
import { useVisitStore } from "../features/travel/visitStore";
import { useTheme } from "../theme/themeStore";

import MilestoneRow from "./MilestonesScreen/MilestoneRow";
import { makeStyles } from "./MilestonesScreen/styles";

type Props = {
  onClose: () => void;
  onOpenTitles: () => void;
};

export default function MilestonesScreen({ onClose, onOpenTitles }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const kind = useMilestoneStore((s) => s.kind);
  const setKind = useMilestoneStore((s) => s.setKind);
  const visitCounts = useVisitStore((s) => s.visitCounts);

  const rows = useMemo(
    () =>
      ALL_MILESTONE_KINDS.map((k) => ({
        kind: k,
        label: t(`milestones.option.${k}`),
        progress: evaluateMilestone(k, visitCounts),
      })),
    [t, visitCounts]
  );

  const handlePick = (k: MilestoneKind) => {
    if (k === kind) return;
    void setKind(k);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.headerSide}>
          <Text style={styles.cancel}>{t("common.close")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("milestones.heading")}</Text>
        <Pressable onPress={onOpenTitles} hitSlop={8} style={styles.headerSide}>
          <Text style={styles.quickLink}>{t("milestones.gotoTitles")} ›</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {rows.map((row) => (
          <MilestoneRow
            key={row.kind}
            theme={theme}
            label={row.label}
            progress={row.progress}
            active={kind === row.kind}
            onPress={() => handlePick(row.kind)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 10.2: i18n 키 추가 — ko.json**

`src/i18n/locales/ko.json` 최상위에 새 섹션 추가 (`titles` 섹션 뒤가 자연스러움):

```json
  "milestones": {
    "heading": "목표 마일스톤",
    "gotoTitles": "호칭",
    "option": {
      "countries": "국가 수",
      "days": "누적 일수",
      "continent_AS": "아시아 전문가",
      "continent_EU": "유럽 전문가",
      "continent_SA": "남미 전문가",
      "continent_AF": "아프리카 전문가",
      "continent_NA": "북미 전문가"
    },
    "preview": {
      "progress": "{{current}} / {{next}}{{unit}}",
      "completed": "달성"
    }
  },
```

- [ ] **Step 10.3: i18n 키 추가 — en.json**

`src/i18n/locales/en.json`에 동일 위치에 추가:

```json
  "milestones": {
    "heading": "Goal Milestone",
    "gotoTitles": "Titles",
    "option": {
      "countries": "Country count",
      "days": "Total days",
      "continent_AS": "Asia expert",
      "continent_EU": "Europe expert",
      "continent_SA": "South America expert",
      "continent_AF": "Africa expert",
      "continent_NA": "North America expert"
    },
    "preview": {
      "progress": "{{current}} / {{next}}{{unit}}",
      "completed": "Done"
    }
  },
```

- [ ] **Step 10.4: 라우트 등록 + 스크린 wrapper 마무리 (Task 8.3 적용)**

`src/navigation/RootNavigator.tsx`의 `Titles` 스크린 등록 직후에 다음 줄 추가하고 import 추가:

```tsx
import MilestonesScreenNav from "./screens/MilestonesScreenNav";
```
```tsx
        <Stack.Screen name="Milestones" component={MilestonesScreenNav} />
```

- [ ] **Step 10.5: 타입 검사**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 10.6: Commit (Task 8/9/10 통합)**

```bash
git add src/navigation/types.ts \
        src/navigation/RootNavigator.tsx \
        src/navigation/screens/MilestonesScreenNav.tsx \
        src/screens/MilestonesScreen.tsx \
        src/i18n/locales/ko.json src/i18n/locales/en.json
git commit -m "feat(milestone): MilestonesScreen 라우트 추가 + i18n 키"
```

---

## Task 11: `TitlesScreen`에 마일스톤 화면 퀵버튼

**Files:**
- Modify: `src/screens/TitlesScreen.tsx`
- Modify: `src/navigation/screens/TitlesScreenNav.tsx`
- Modify: `src/i18n/locales/ko.json`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/screens/TitlesScreen/styles.ts`

- [ ] **Step 11.1: `TitlesScreen` props에 `onOpenMilestones` 추가**

`src/screens/TitlesScreen.tsx`:

```tsx
type Props = { onClose: () => void; onOpenMilestones: () => void };

export default function TitlesScreen({ onClose, onOpenMilestones }: Props) {
```

헤더 우측 placeholder를 퀵버튼으로 교체:

```tsx
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.headerSide}>
          <Text style={styles.cancel}>{t("common.close")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("titles.heading")}</Text>
        <Pressable
          onPress={onOpenMilestones}
          hitSlop={8}
          style={styles.headerSide}
        >
          <Text style={styles.quickLink}>{t("titles.gotoMilestones")} ›</Text>
        </Pressable>
      </View>
```

- [ ] **Step 11.2: `quickLink` 스타일 추가**

`src/screens/TitlesScreen/styles.ts`의 `cancel` 다음에 추가:

```ts
    quickLink: {
      color: theme.accent,
      fontSize: 14,
      fontWeight: "600",
    },
```

- [ ] **Step 11.3: nav wrapper에서 prop 전달**

`src/navigation/screens/TitlesScreenNav.tsx`:

```tsx
      <TitlesScreen
        onClose={() => navigation.goBack()}
        onOpenMilestones={() => navigation.navigate("Milestones")}
      />
```

- [ ] **Step 11.4: i18n 키 추가**

`ko.json`의 `titles` 블록에 `"gotoMilestones": "마일스톤"` 추가.
`en.json`의 `titles` 블록에 `"gotoMilestones": "Milestones"` 추가.

- [ ] **Step 11.5: 타입 검사**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 11.6: Commit**

```bash
git add src/screens/TitlesScreen.tsx \
        src/screens/TitlesScreen/styles.ts \
        src/navigation/screens/TitlesScreenNav.tsx \
        src/i18n/locales/ko.json src/i18n/locales/en.json
git commit -m "feat(titles): 헤더에 마일스톤 화면 퀵버튼 추가"
```

---

## Task 12: `SettingsScreen`에 "목표 마일스톤" 섹션 추가

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/navigation/screens/SettingsScreenNav.tsx`
- Modify: `src/i18n/locales/ko.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 12.1: `SettingsScreen` props 확장**

`src/screens/SettingsScreen.tsx` Props에 `onOpenMilestones: () => void` 추가:

```tsx
type Props = {
  onClose: () => void;
  onAddTrip: () => void;
  onOpenTitles: () => void;
  onOpenMilestones: () => void;
  onChangeHome: () => void;
  onReviewSuspect: () => void;
  onOpenLanguage: () => void;
};
```

함수 시그니처도 업데이트.

- [ ] **Step 12.2: 마일스톤 미리보기 텍스트 계산**

기존 `activeBadge`/`titleSub` 계산 직후에 추가:

```tsx
  const milestoneKind = useMilestoneStore((s) => s.kind);
  const milestoneProgress = useMemo(
    () => evaluateMilestone(milestoneKind, visitCounts),
    [milestoneKind, visitCounts]
  );
  const milestoneSub = milestoneProgress.reachedFinal
    ? t("settings.milestone.previewCompleted", {
        name: t(`milestones.option.${milestoneKind}`),
      })
    : t("settings.milestone.previewProgress", {
        name: t(`milestones.option.${milestoneKind}`),
        current: milestoneProgress.current,
        next: milestoneProgress.next,
        unit:
          milestoneProgress.unit === "days"
            ? t("home.daysUnit")
            : t("home.countriesUnit"),
      });
```

상단 import에 추가:

```tsx
import { evaluateMilestone } from "../features/milestone/milestoneEvaluator";
import { useMilestoneStore } from "../features/milestone/milestoneStore";
```

- [ ] **Step 12.3: 마일스톤 섹션 UI 삽입**

기존 "호칭" 섹션 직후, "언어" 섹션 직전 위치에:

```tsx
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t("settings.section.milestone")}
        </Text>
        <View style={styles.card}>
          <ActionRow
            theme={theme}
            label={t("settings.milestone.label")}
            sub={milestoneSub}
            onPress={onOpenMilestones}
          />
        </View>
```

- [ ] **Step 12.4: nav wrapper에서 prop 전달**

`src/navigation/screens/SettingsScreenNav.tsx`:

```tsx
      <SettingsScreen
        onClose={() => navigation.goBack()}
        onAddTrip={() => navigation.navigate("AddTrip")}
        onOpenTitles={() => navigation.navigate("Titles")}
        onOpenMilestones={() => navigation.navigate("Milestones")}
        onChangeHome={() => navigation.navigate("ChangeHome")}
        onReviewSuspect={() => navigation.navigate("ReviewSuspect")}
        onOpenLanguage={() => navigation.navigate("Language")}
      />
```

- [ ] **Step 12.5: i18n 키 추가 — ko.json**

`settings.section`에 `"milestone": "목표 마일스톤"` 추가.
`settings`에 `milestone` 블록 추가:

```json
    "milestone": {
      "label": "목표 마일스톤",
      "previewProgress": "현재: {{name}} ({{current}} / {{next}}{{unit}})",
      "previewCompleted": "현재: {{name}} (달성)"
    },
```

- [ ] **Step 12.6: i18n 키 추가 — en.json**

`settings.section`에 `"milestone": "Goal Milestone"` 추가.
`settings`에 `milestone` 블록 추가 (영어 번역).

```json
    "milestone": {
      "label": "Goal milestone",
      "previewProgress": "Current: {{name}} ({{current}} / {{next}}{{unit}})",
      "previewCompleted": "Current: {{name}} (done)"
    },
```

- [ ] **Step 12.7: 타입 검사**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 12.8: Commit**

```bash
git add src/screens/SettingsScreen.tsx \
        src/navigation/screens/SettingsScreenNav.tsx \
        src/i18n/locales/ko.json src/i18n/locales/en.json
git commit -m "feat(settings): 목표 마일스톤 항목 추가"
```

---

## Task 13: `MainScreen` `statCard`를 마일스톤 평가에 연동

**Files:**
- Modify: `src/screens/MainScreen/index.tsx`
- Modify: `src/i18n/locales/ko.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 13.1: import 추가 + 마일스톤 평가**

`src/screens/MainScreen/index.tsx` 상단 import에 추가:

```tsx
import { evaluateMilestone } from "../../features/milestone/milestoneEvaluator";
import { useMilestoneStore } from "../../features/milestone/milestoneStore";
```

(기존 `import { getTierByCount, TIER_CUTOFFS } ...`에서 `TIER_CUTOFFS`는 이제 사용 안 하므로 제거 — 하지만 `getTierByCount`는 활성 뱃지(자동 모드)용으로 그대로 둠.)

기존 `milestone` `useMemo` 블록을 다음으로 교체:

```tsx
  const milestoneKind = useMilestoneStore((s) => s.kind);
  const milestoneProgress = useMemo(
    () => evaluateMilestone(milestoneKind, visitCounts),
    [milestoneKind, visitCounts]
  );
```

상단의 `visitCounts` 사용을 위해 다음 라인 추가 (기존 visitStore 호출 옆):

```tsx
  const visitCounts = useVisitStore((s) => s.visitCounts);
```

(기존 `activeCounts`는 그대로 두되, **마일스톤 카드만** `visitCounts` 기반으로 변경한다. 홈 상단 통계 `totals`는 변경 없음.)

- [ ] **Step 13.2: `statCard` 진행률·푸터 표시 교체**

기존 코드:

```tsx
            <View style={styles.statBigRow}>
              <Text style={styles.statBigNum}>{totals.countries}</Text>
              <Text style={styles.statBigDenom}> / {milestone.next}</Text>
              <Text style={styles.statBigPercent}>  {percent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      (totals.countries / milestone.next) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.statFooter}>
              <Text style={styles.statFooterLabel}>
                {t("home.nextMilestone")}{" "}
                <Text style={styles.statFooterStrong}>
                  {t("home.milestoneCountries", { count: milestone.next })}
                </Text>
              </Text>
            </View>
```

다음으로 교체:

```tsx
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
            <View style={styles.statFooter}>
              <Text style={styles.statFooterLabel}>
                {milestoneProgress.reachedFinal
                  ? t("home.milestoneFooter.completed")
                  : milestoneProgress.unit === "days"
                    ? t("home.milestoneFooter.days", {
                        count: (milestoneProgress.next ?? 0) - milestoneProgress.current,
                      })
                    : t("home.milestoneFooter.countries", {
                        count: (milestoneProgress.next ?? 0) - milestoneProgress.current,
                      })}
              </Text>
            </View>
```

- [ ] **Step 13.3: `percent`/`milestone` 로컬 변수 사용처 정리**

`MainScreen/index.tsx`에서 기존 `const percent = ...` 라인과 `milestone` 변수 정의(이미 위에서 교체됨)에 더 이상 참조가 없는지 확인. 필요시 제거.

`grep -n "milestone\.\|percent" src/screens/MainScreen/index.tsx` 로 확인하고 미사용 라인 제거.

- [ ] **Step 13.4: `statCard` 탭 동작을 `Titles` → `Milestones`로 변경**

기존:
```tsx
          <Pressable
            onPress={() => navigation.navigate("Titles")}
```

변경:
```tsx
          <Pressable
            onPress={() => navigation.navigate("Milestones")}
```

- [ ] **Step 13.5: i18n 키 추가 — ko.json**

`home` 블록에서 `nextMilestone`, `milestoneCountries` 두 줄 제거하고 다음으로 교체:

```json
    "milestoneFooter": {
      "countries": "다음 호칭 획득까지 {{count}}개국",
      "days": "다음 호칭 획득까지 {{count}}일",
      "completed": "최고 단계 달성 🎉"
    },
```

- [ ] **Step 13.6: i18n 키 추가 — en.json**

`home` 블록에서 `nextMilestone`, `milestoneCountries` 두 줄 제거하고 다음으로 교체:

```json
    "milestoneFooter": {
      "countries": "{{count}} more to next title",
      "days": "{{count}} more days to next title",
      "completed": "Top tier reached 🎉"
    },
```

- [ ] **Step 13.7: 다른 locale 파일 정리 (영문 fallback 일관성)**

`grep -l "nextMilestone\|milestoneCountries" src/i18n/locales/*.json` 으로 다른 locale 파일에 같은 키가 남아 있는지 확인.

남아 있다면 — 해당 locale에서도 `nextMilestone`/`milestoneCountries`를 제거하고 `milestoneFooter` 블록을 영어 텍스트(또는 해당 언어 번역)로 추가한다. 확실하지 않으면 영어 텍스트(en.json과 동일)를 fallback으로 둔다.

이 step은 다른 locale을 깨뜨리지 않기 위해 반드시 수행한다.

- [ ] **Step 13.8: 타입 검사**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 13.9: Commit**

```bash
git add src/screens/MainScreen/index.tsx src/i18n/locales/
git commit -m "feat(home): 마일스톤 카드를 선택된 마일스톤 평가로 구동"
```

---

## Task 14: 수동 검증

테스트 라이브러리가 없으므로 수동 검증으로 마무리.

- [ ] **Step 14.1: 앱 실행**

Run: `npm run ios` 또는 `npm run android`
(개발 빌드가 이미 있다면 metro만 — `npm run start`)

- [ ] **Step 14.2: 신규 사용자 흐름 (마일스톤 미설정)**

기존 빌드를 그대로 실행. 첫 화면에서 마일스톤 카드가 **국가 수 기본값**으로 동작하는지 확인. (현재 데이터 기준 진행률·푸터가 합리적)

- [ ] **Step 14.3: Settings에서 마일스톤 변경**

설정 → "목표 마일스톤" → 마일스톤 화면 진입. 7개 옵션 모두 보이고 현재값 미리보기가 표시되는지 확인.

- [ ] **Step 14.4: 각 마일스톤 종류 검증**

- "누적 일수" 선택 → 닫기 → 홈에서 카드가 `현재일수 / 다음일수컷오프  N%` + `다음 호칭 획득까지 N일` 표시.
- "유럽 전문가" 선택 → 닫기 → 홈에서 유럽 방문 국가 수가 카드에 표시.
- 데이터가 충분하면 정복자 도달 케이스에서 "최고 단계 달성 🎉" 표시.

- [ ] **Step 14.5: 홈 카드 직접 탭**

홈 마일스톤 카드 탭 → `MilestonesScreen`으로 이동(이전엔 `Titles`였음). 헤더 우측 "호칭 ›" 탭 → `TitlesScreen`으로 이동. 호칭 화면 헤더 우측 "마일스톤 ›" 탭 → 다시 `MilestonesScreen`. 양방향 왕복 OK.

- [ ] **Step 14.6: 호칭 시스템 영향 확인**

설정 → 호칭 → 대륙 섹션에 "{대륙} 여행자"가 새로 보이는지(잠금 해제된 입문 단계). `pendingNotifications` 큐에 신규 입문 호칭이 들어와 알림 노출되는지(첫 평가가 끝난 사용자라면). `seeded`가 false였던 사용자는 묵음.

- [ ] **Step 14.7: 앱 재시작 후 선택값 유지**

앱 강제 종료 후 재실행. 마지막에 고른 마일스톤 종류가 유지되는지 확인.

- [ ] **Step 14.8: 빌드 정리 commit (변경사항 없으면 skip)**

수동 검증에서 발견한 자잘한 수정은 별도 commit으로.

---

## 자체 검토 (Self-Review)

이 plan을 spec과 대조한 결과:

- §3 결정 사항 표 7개 항목 → Task 1, 2, 3, 6, 8, 10, 12, 13에 매핑됨. ✓
- §4 데이터 모델 → Task 1, 5, 6, 7. ✓
- §5 평가 로직 → Task 6. `visitCounts` 사용 의도(누적) 명시. ✓
- §6 대륙 단계 확장 → Task 2, 3, 4. ✓
- §7 UI 변경 → Task 9, 10, 11, 12, 13. ✓
- §8 라우팅 → Task 8, 10. ✓
- §9 마이그레이션 → 신규 사용자는 Task 7의 `DEFAULT_MILESTONE_KIND` fallback으로 자연스럽게 동작. 입문 호칭 신규 평가는 기존 `evaluateBadges` 흐름이 자동 처리(Task 3). ✓
- §10 i18n → Task 4, 10, 11, 12, 13에 분산. 다른 locale 정리는 Task 13.7. ✓
- §11 파일 구조 → Task 1, 5, 6, 7, 9, 10에 1:1 매핑. ✓
- §12 테스트 전략 → 단위 테스트 라이브러리가 없어 본 플랜은 수동 검증(Task 14)으로 대체. **이는 의도적 차이.**
- §13 범위 외 → 모두 plan에서 제외됨. ✓

타입/명칭 일관성:
- `MilestoneKind` / `MilestoneProgress` / `evaluateMilestone` / `useMilestoneStore` / `loadMilestoneKind` / `saveMilestoneKind` 모두 일관.
- `continent_${id}_initiate` BadgeId가 Task 3, 4, 6에서 동일.
- `milestoneFooter.countries|days|completed` i18n 키가 Task 13에서 일관.

플레이스홀더 스캔: 없음. 모든 코드 블록은 실행 가능한 형태.
