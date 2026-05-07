# 목표 마일스톤 선택 — 설계 문서

작성일: 2026-05-07
관련 기획서: [`docs/마일스톤_뱃지_기획서.md`](../../마일스톤_뱃지_기획서.md)

## 1. 배경

홈 화면 마일스톤 컴포넌트(`MainScreen` `statCard`)는 현재 **방문 국가 수**만 진행 기준으로 사용한다. 사용자는 자신의 여행 스타일에 맞는 다른 목표(누적 일수·특정 대륙)를 추적하고 싶어 한다.

호칭(Badge) 시스템은 이미 잘 분리되어 있다. 사용자는 `TitlesScreen`에서 활성 호칭을 자유롭게 선택할 수 있고, `activeId == null`이면 등급 호칭이 자동 부여된다. 본 변경은 **호칭과 무관한 별도 축**으로 "목표 마일스톤"을 도입한다.

## 2. 사용자 시나리오

- 일수 위주로 여행하는 사용자가 "1000일까지 N일" 진행을 홈에서 보고 싶다.
- 유럽 정복을 목표로 하는 사용자가 유럽 국가 수 진행을 홈에서 보고 싶다.
- 위 사용자들도 호칭은 별개 기준으로(예: 명예 등급 뱃지) 자유롭게 표시하고 싶다.

## 3. 결정 사항 요약

| 항목 | 결정 |
|---|---|
| 마일스톤 종류 | 7개 옵션 중 1개 선택 — 국가 수 / 일수 / 아시아 / 유럽 / 남미 / 아프리카 / 북미 |
| 기본값 | 국가 수 (현재 동작 유지) |
| 진입점 | (1) Settings 화면 항목, (2) 홈 마일스톤 컴포넌트 직접 탭 |
| 상호 이동 | 마일스톤 화면 ↔ 호칭 화면 양쪽에 퀵버튼 |
| 대륙 단계 | 입문 → 탐방가 → 정복자 (3단계, 입문 신규 추가) |
| 푸터 라벨 | "다음 호칭 획득까지 N개국" / "다음 호칭 획득까지 N일" |
| 최종 단계 도달 | 진행바 100% + "최고 단계 달성 🎉" 메시지 |
| 호칭 시스템 | 변경 없음 (대륙 입문 단계 호칭만 신규 추가) |

## 4. 데이터 모델

### 4.1 마일스톤 타입

`src/features/milestone/milestoneTypes.ts` (신규)

```ts
export type MilestoneKind =
  | "countries"
  | "days"
  | "continent_AS"
  | "continent_EU"
  | "continent_SA"
  | "continent_AF"
  | "continent_NA";

export const DEFAULT_MILESTONE_KIND: MilestoneKind = "countries";
```

### 4.2 마일스톤 평가 결과

각 마일스톤 종류에 대해 동일한 형태로 진행 상태를 산출한다. UI는 이 형태만 알면 된다.

```ts
export type MilestoneProgress = {
  kind: MilestoneKind;
  /** 현재 값 (방문 국가 수 / 누적 일수 / 해당 대륙 방문 국가 수) */
  current: number;
  /** 다음 단계 컷오프. 최종 단계 도달 시 null */
  next: number | null;
  /** 다음 단계에서 부여될 호칭 라벨 (i18n 키 또는 BadgeId 기반). 최종 단계면 null */
  nextTitleBadgeId: string | null;
  /** 진행률 0~100. 최종 단계는 100 고정 */
  percent: number;
  /** true면 최종 단계 도달 — UI는 "최고 단계 달성 🎉" 표시 */
  reachedFinal: boolean;
  /** 푸터 라벨에 들어갈 단위 ("countries" | "days") — i18n 분기 */
  unit: "countries" | "days";
};
```

### 4.3 저장

선택된 마일스톤은 AsyncStorage에 단일 키로 저장. 기존 `badgeStorage` 패턴을 따라 `src/features/milestone/milestoneStorage.ts`에 분리.

키: `@visitgrid/milestone/kind` — 값은 `MilestoneKind` 문자열.

## 5. 평가 로직

`src/features/milestone/milestoneEvaluator.ts` (신규)

입력:
- `kind: MilestoneKind`
- `visitCounts: Record<string, number>` (`useVisitStore`에서)
- `activeCounts`(연도 필터 적용 후) — **마일스톤은 누적 기준이므로 `visitCounts`(전체)를 사용한다.** (현재 home 화면 진행률은 `activeCounts`를 쓰고 있는데, 마일스톤은 항상 누적이어야 적절. ⚠️ 동작 변경 — §9 마이그레이션 참고.)

출력: `MilestoneProgress`

분기:

- **국가 수** (`countries`):
  - `current` = 본국 포함 방문 국가 수 (`Object.keys(visitCounts).length`)
  - 컷오프 풀 = `TIER_CUTOFFS` ([1,2,3,4,6,9,14,22,36,50,75,100,150,193])
  - `next` = 첫 번째 `cutoff > current`. 없으면 `reachedFinal = true`, `next = null`.
  - `nextTitleBadgeId` = `tier_${tier.id}` (해당 컷오프 등급)
  - `unit = "countries"`

- **일수** (`days`):
  - `current` = `Object.values(visitCounts).reduce((a,b)=>a+b,0)`
  - 컷오프 풀 = `[7, 30, 100, 365, 730, 1000]` (DAY_TIERS 임계치)
  - `nextTitleBadgeId` = `days_${threshold}`
  - `unit = "days"`

- **대륙** (`continent_XX`):
  - `current` = 해당 대륙에 속하는 방문 국가 수
  - 컷오프 풀 = `[initiate, wanderer, conqueror]` (대륙별)
  - `nextTitleBadgeId` = `continent_XX_initiate` / `_wanderer` / `_conqueror`
  - `unit = "countries"`

`reachedFinal`이면 `percent = 100`, 아니면 `percent = Math.round((current / next) * 1000) / 10`.

## 6. 대륙 단계 확장

[`src/features/badges/continents.ts`](../../../src/features/badges/continents.ts)의 `ContinentDefinition`에 `initiate` 필드 추가:

```ts
export type ContinentDefinition = {
  id: ContinentId;
  nameKo: string;
  nameEn: string;
  initiate: number;   // 신규
  wanderer: number;
  conqueror: number;
};
```

| 대륙 | initiate | wanderer | conqueror |
|---|---|---|---|
| AS 아시아 | 2 | 5 | 12 |
| EU 유럽 | 2 | 5 | 15 |
| AF 아프리카 | 2 | 4 | 10 |
| NA 북미 | 1 | 3 | 8 |
| SA 남미 | 1 | 3 | 7 |
| OC 오세아니아 | 1 | 2 | 5 | (마일스톤 옵션엔 없지만 뱃지 카탈로그에는 추가)
| AN 남극 | (특수: 1만 있음, initiate 미적용) |

[`src/features/badges/badges.ts`](../../../src/features/badges/badges.ts)의 호칭 추가:
- 신규 호칭: `${def.nameKo} 여행자` / `${def.nameEn} Traveler`
- BadgeId: `continent_${id}_initiate`
- `evaluateBadges`/`badgeFromId`/`getStaticBadgeCatalog`에 `initiate` 분기 추가
- `rank`: 18 (wanderer 20 < conqueror 25 보다 낮게)

남극(AN)은 입문 단계를 두지 않는다(현재도 wanderer/conqueror 동일). 남극은 마일스톤 옵션에도 포함되지 않는다.

## 7. UI 변경

### 7.1 홈 화면 마일스톤 컴포넌트 ([`MainScreen/index.tsx`](../../../src/screens/MainScreen/index.tsx) `statCard`)

```
┌────────────────────────────────────────────┐
│ 호칭                          ⭐️ 마스터    │  ← 활성 뱃지 (마일스톤 무관)
│                                            │
│ 42 / 50      84%                           │  ← 마일스톤 현재값/다음컷오프/진행률
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░ │  ← 진행바
│                                            │
│ 다음 호칭 획득까지 8개국                    │  ← 푸터 라벨
└────────────────────────────────────────────┘
```

최종 단계 도달 시:

```
│ 193 / 193    100%                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 최고 단계 달성 🎉                           │
```

- `statTitle` 라벨은 그대로 "호칭"(현재 `home.statTitle` i18n 키 "호칭" / "Title").
- `statTier` 텍스트(우측 상단)는 그대로 활성 뱃지 — 마일스톤과 무관.
- 탭 동작: 기존 `navigation.navigate("Titles")` → **`navigation.navigate("Milestones")`** 로 변경.

### 7.2 신규 화면: `MilestonesScreen`

[`src/screens/MilestonesScreen.tsx`](../../../src/screens/MilestonesScreen.tsx) (신규)
스타일 분리 — [`MilestonesScreen/styles.ts`](../../../src/screens/MilestonesScreen/styles.ts)

레이아웃 (TitlesScreen과 일관된 패턴):

```
┌────────────────────────────────────────────┐
│ 닫기   목표 마일스톤            호칭 선택→  │  ← 헤더 + 호칭 화면 퀵버튼
├────────────────────────────────────────────┤
│ ◯ 국가 수                 42 / 50개국     │
│ ● 누적 일수               87 / 100일     │  ← 현재 선택 표시
│ ◯ 아시아 전문가           4 / 5개국      │
│ ◯ 유럽 전문가             8 / 15개국     │
│ ◯ 남미 전문가             0 / 1개국      │
│ ◯ 아프리카 전문가         1 / 2개국      │
│ ◯ 북미 전문가             3 / 3개국 ✅   │  ← 정복자 도달
└────────────────────────────────────────────┘
```

- 각 옵션은 라디오 형태. 탭하면 즉시 선택·저장. 화면은 자동으로 닫히지 않으며 사용자가 닫기 버튼으로 빠져나갈 때 홈에 반영된 결과를 확인한다(다른 옵션과 비교해볼 수 있도록).
- 옵션 우측에 "현재값 / 다음컷오프단위" 미리보기. 최종 단계는 ✅ 또는 "달성".
- 헤더 우측에 **호칭 화면 퀵버튼** ("호칭 →" 라벨). `navigation.navigate("Titles")` 사용 — 마일스톤 화면은 스택에 남아 뒤로가기로 복귀.

### 7.3 `TitlesScreen` 수정

[`src/screens/TitlesScreen.tsx`](../../../src/screens/TitlesScreen.tsx) 헤더 우측에 **마일스톤 화면 퀵버튼** 추가. 현재 `headerSide`가 placeholder로 비어 있어 거기에 넣는다. `navigation.navigate("Milestones")` 사용.

### 7.4 Settings 화면 수정

[`src/screens/SettingsScreen.tsx`](../../../src/screens/SettingsScreen.tsx) "호칭" 섹션 직전 또는 직후에 **"목표 마일스톤"** 섹션 추가:

```
section.milestone
  label: "목표 마일스톤"
  sub: "현재: 누적 일수 (87 / 100일)"
  onPress → onOpenMilestones
```

`SettingsScreen` Props에 `onOpenMilestones` 추가. `RootNavigator`에서 라우트 연결.

## 8. 라우팅

[`src/navigation/types.ts`](../../../src/navigation/types.ts)에 `Milestones` 라우트 추가. [`src/navigation/RootNavigator.tsx`](../../../src/navigation/RootNavigator.tsx)에 스크린 등록.

스크린 wrapper: [`src/navigation/screens/MilestonesScreenNav.tsx`](../../../src/navigation/screens/MilestonesScreenNav.tsx)

## 9. 마이그레이션 / 호환성

- **신규 사용자**: `milestone.kind` 미저장 시 기본값 `countries` → 현재와 동일하게 동작.
- **기존 사용자**: 첫 로드 시 `loadMilestoneKind()`가 `null` 반환 → 기본값 적용. 사용자 행동에 변화 없음.
- **현재 진행률 계산이 `activeCounts`(연도 필터 반영)를 쓰는 점**: 마일스톤은 누적이 자연스러우므로 `visitCounts`(전체) 사용으로 변경. 다만 홈 상단 통계(`totals.countries`/`totals.days`)는 그대로 `activeCounts`를 쓴다 — 마일스톤 카드의 "현재값"만 마일스톤 평가에서 가져온다.
- **뱃지 마이그레이션**: 대륙 입문 단계 호칭은 신규 추가. 첫 평가 시 도달한 모든 입문 단계가 `unlocked`에 추가되며, 첫 `evaluate` 호출은 `seeded=true` 이후이므로 `pendingNotifications`에 들어가 사용자에게 노출됨. `seeded`가 false였던 사용자는 묵음 처리됨(기존 동작과 일관).

## 10. i18n

신규 키:

```
home.milestoneFooter.countries: "다음 호칭 획득까지 {{count}}개국"
home.milestoneFooter.days: "다음 호칭 획득까지 {{count}}일"
home.milestoneFooter.completed: "최고 단계 달성 🎉"

milestones.heading: "목표 마일스톤"
milestones.option.countries: "국가 수"
milestones.option.days: "누적 일수"
milestones.option.continent_AS: "아시아 전문가"
milestones.option.continent_EU: "유럽 전문가"
milestones.option.continent_SA: "남미 전문가"
milestones.option.continent_AF: "아프리카 전문가"
milestones.option.continent_NA: "북미 전문가"
milestones.preview.progress: "{{current}} / {{next}}{{unit}}"
milestones.preview.completed: "달성"
milestones.gotoTitles: "호칭"

titles.gotoMilestones: "마일스톤"

settings.section.milestone: "목표 마일스톤"
settings.milestone.label: "목표 마일스톤"
settings.milestone.previewProgress: "현재: {{name}} ({{current}} / {{next}}{{unit}})"
settings.milestone.previewCompleted: "현재: {{name}} (달성)"

continent.AS.initiate: "아시아 여행자"  (영어: "Asia Traveler")
continent.EU.initiate: "유럽 여행자"   ("Europe Traveler")
continent.AF.initiate: "아프리카 여행자" ("Africa Traveler")
continent.NA.initiate: "북아메리카 여행자" ("North America Traveler")
continent.SA.initiate: "남아메리카 여행자" ("South America Traveler")
continent.OC.initiate: "오세아니아 여행자" ("Oceania Traveler")
```

기존 키 변경:
- `home.nextMilestone` + `home.milestoneCountries` 조합은 푸터 새 라벨로 대체됨. 기존 키는 제거.

## 11. 파일 구조 (신규)

```
src/features/milestone/
  milestoneTypes.ts      // MilestoneKind, MilestoneProgress, DEFAULT_MILESTONE_KIND
  milestoneEvaluator.ts  // evaluateMilestone(kind, visitCounts) → MilestoneProgress
  milestoneStorage.ts    // load/save (AsyncStorage)
  milestoneStore.ts      // zustand store (kind, hydrate, setKind)

src/screens/MilestonesScreen.tsx
src/screens/MilestonesScreen/styles.ts
src/screens/MilestonesScreen/MilestoneRow.tsx   // 옵션 1행 컴포넌트

src/navigation/screens/MilestonesScreenNav.tsx
```

CLAUDE.md §5("Split Files Aggressively")에 따라 `MilestoneRow`를 별도 파일로 분리. `MilestonesScreen.tsx`는 리스트 + 헤더만 담당.

## 12. 테스트 전략

`milestoneEvaluator`는 순수 함수이므로 단위 테스트:
- 각 마일스톤 종류에 대해 (a) 시작값, (b) 중간 컷오프 직전/직후, (c) 최종 단계 도달의 진행률·next·reachedFinal 검증
- `visitCounts`가 비어 있을 때 모든 종류가 의미 있는 시작 상태를 반환하는지

UI는 수동 검증:
- Settings → 마일스톤 변경 → 홈에서 즉시 반영
- 마일스톤 화면 ↔ 호칭 화면 퀵버튼 왕복
- 최종 단계 도달 케이스(예: 남미 7개국 모두 방문)에서 "최고 단계 달성 🎉" 표시

## 13. 범위 외 (이번에 하지 않음)

- 마일스톤별 알림(달성 시 푸시)
- 마일스톤 변경 이력 보존
- "남은 N개국 중 어느 나라" 추천
- 오세아니아·남극 마일스톤 옵션
