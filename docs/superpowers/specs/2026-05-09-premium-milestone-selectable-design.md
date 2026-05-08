# Premium 마일스톤을 대표 마일스톤으로 선택 가능하게 (단계 1: 7종)

날짜: 2026-05-09
상태: 디자인 승인 대기 → 구현 plan 작성 예정

## 배경

현재 유료 사용자(`isAllMilestoneVisible: true`)는 premium 마일스톤 10종에 해당하는 호칭을 자동으로 부여받지만, "대표 마일스톤"(추적할 진행률 마일스톤)으로는 선택할 수 없다. `MilestonesScreen`은 무료 7종(`countries`, `days`, 5개 대륙)만 `MilestoneRow`로 렌더하며, premium 10종은 `PremiumSection`에서 정보 카드 형태로만 표시되고 `<Pressable>`이 아니다.

데이터 레이어는 premium kind 저장을 이미 허용한다 (`milestoneStore.hydrate`에서 `isAllMilestoneVisible: true`인 경우 premium kind를 그대로 복원). UI 진입점만 비어 있는 상태다.

## 목표

유료 사용자가 premium 마일스톤을 대표 마일스톤으로 선택하여, 무료 마일스톤과 동일한 진행률·다음 호칭 안내 UX를 받을 수 있게 한다.

## 범위 (단계 1)

10종 중 단계가 명확한 누적형 7종만 이번 단계에서 선택 가능하게 한다:

- `premium_humanity` (인구 점유율)
- `premium_earth_area` (면적 점유율)
- `premium_calendar` (해외 사진 월 수)
- `premium_flag_palette` (방문국 국기 색 수)
- `premium_un_linguist` (UN 6공용어 보유 수)
- `premium_age_match` (현재 만 나이 배수의 방문국 수)
- `premium_round_the_clock` (방문국 UTC offset 시차)

범위 외 3종은 단계 1에서 **선택 불가**로 둔다 — 시간 의존(`premium_n_before_n`, `premium_decade_stamps`)과 동적(`premium_four_seasons`) 마일스톤은 별도 단계에서 진행률 모델을 따로 설계한다. 호칭은 기존대로 자동 부여된다.

## 비범위

- 범위 외 3종(`n_before_n`, `decade_stamps`, `four_seasons`)에 대한 진행률 모델·UI
- 무료 사용자에게 보이는 자물쇠 카드 디자인 변경 (그대로 유지)
- 호칭 부여 로직 변경 (`evaluatePremiumBadges`는 그대로 유지)
- `MainScreen`의 진행률 표시 변경 (이미 `useMilestoneStore().kind`를 따라가므로 자동으로 premium kind를 받게 됨; 표시값은 `evaluateMilestone` 결과에 의존)

## 데이터 모델 변경

### `MilestoneProgress.unit` 확장

`src/features/milestone/milestoneTypes.ts`:

```ts
unit: "countries" | "days" | "months" | "colors" | "languages" | "percent" | "hours"
```

추가 단위 5종: `months`, `colors`, `languages`, `percent`, `hours`. 기존 두 단위(`countries`, `days`)는 그대로.

### `evaluateMilestone()` 시그니처 확장

`src/features/milestone/milestoneEvaluator.ts`:

```ts
export type MilestoneEvalContext = {
  visitCounts: Record<string, number>;
  homeCountry: string | null;
  birth: BirthDate | null;
  photos: PremiumPhoto[];          // 본국 포함 사진 (calendar 평가에서 본국 필터링)
  visitedCountryCodes: string[];    // 본국 포함 방문국
  currentAge: number | null;
};

export function evaluateMilestone(
  kind: MilestoneKind,
  ctx: MilestoneEvalContext
): MilestoneProgress
```

기존 호출부는 모두 컨텍스트를 만들어 전달한다. `buildPremiumContext`(이미 존재)에서 동일 데이터를 받아 일부 필드를 재사용한다.

호출부:
- `MilestonesScreen.tsx`: `evaluateMilestone(k, ctx)` — `ctx`는 `useVisitStore`, `useProfileStore` 조합으로 빌드
- `MainScreen/index.tsx`: 동일

`countries` / `days` / `continent_*` 분기는 `ctx.visitCounts`만 쓰므로 동작은 변하지 않는다.

## Premium 평가 로직

7종 모두 `buildProgress(kind, current, next, nextTitleBadgeId, unit)` 형태로 통일한다. 단계 컷오프와 호칭 매핑:

| kind | current 산식 | 컷오프 | 다음 호칭 ID | unit |
|---|---|---|---|---|
| `premium_humanity` | `floor(visitedPop / WORLD_POPULATION × 100)` | `25, 50, 75` | `premium_humanity_{cutoff}` | `percent` |
| `premium_earth_area` | `floor(visitedArea / EARTH_LAND_AREA_KM2 × 100)` | `25, 50, 75` | `premium_earth_{cutoff}` | `percent` |
| `premium_calendar` | 본국 외 사진 월 수 (1~12) | `6, 12` | `premium_calendar_{cutoff}` | `months` |
| `premium_flag_palette` | 방문국 국기에서 모인 색 수 (0~7) | `5, 7` | `premium_flag_palette_{cutoff}` | `colors` |
| `premium_un_linguist` | UN 6공용어 중 보유 수 (0~6) | `3, 6` | `premium_un_linguist_{cutoff}` | `languages` |
| `premium_age_match` | 방문국 수 (`visitedCountryCodes.length`) | `round(age × 1)`, `round(age × 1.5)`, `round(age × 2)` | `premium_age_match_x1`, `premium_age_match_x1_5`, `premium_age_match_x2` | `countries` |
| `premium_round_the_clock` | `max(offsets) − min(offsets)` (시간) | `24` | `premium_round_the_clock` | `hours` |

### 엣지 케이스

기존 `buildProgress`는 `next == null`이면 `reachedFinal: true`로 강제하므로, "평가 불가"(birth/homeCountry 미설정 등) 상태와 "최고 단계 달성" 상태를 구분할 수 없다. 따라서 `MilestoneProgress`에 새 필드를 추가한다:

```ts
type MilestoneProgress = {
  ...
  /** 평가에 필요한 사용자 데이터가 없을 때 사유. UI에서 진행률 대신 안내 문구 분기에 사용. null이면 정상 평가 결과. */
  unsupportedReason: "needs_birth" | "needs_home_country" | null;
};
```

- **`age_match`에 `birth`/`currentAge`가 없을 때**: `unsupportedReason: "needs_birth"`, `current: 0, next: null, reachedFinal: false, percent: 0`을 직접 반환 (`buildProgress` 우회).
- **`calendar`에 `homeCountry`가 없을 때**: `unsupportedReason: "needs_home_country"`, 나머지는 위와 동일한 형태로 반환. 본국 정의 없이 "해외 사진"을 평가할 수 없기 때문.
- **`humanity` / `earth_area`에서 75% 이상**: 마지막 컷오프 도달이므로 `buildProgress`로 처리되어 자동으로 `reachedFinal = true`.
- **`flag_palette` / `un_linguist`**: 본국이 방문국 목록에 포함될 수 있으나, 두 평가 모두 방문국 코드 집합 기반이므로 본국 필터링 정책은 기존 evaluator(`evaluateFlagPalette`, `evaluateUnLinguist`)와 동일하게 본국을 포함한 채로 평가. 색·언어 데이터는 `FlagColor`(7색), `UnLanguage`(6개 UN 공용어)로 닫힌 집합.
- **`round_the_clock`에 방문국 1개 이하**: `current = 0, next = 24`로 반환 (정상 진행률, unsupportedReason 없음 — 단지 진행이 없을 뿐).
- 기존 `countries`/`days`/`continent_*` 분기는 모두 `unsupportedReason: null`을 채워 반환.

### 평가 함수 분리

기존 `src/features/milestone/premium/evaluators/*.ts`는 "달성한 호칭 목록"을 반환하는 형태다. 진행률 계산은 입력은 같지만 출력 형태가 다르므로 새 모듈로 분리:

- `src/features/milestone/premium/evaluatePremiumProgress.ts` — `evaluatePremiumProgress(kind, ctx)` 단일 진입점, 내부에서 7종 분기

기존 evaluator 파일들은 그대로 두고 호칭 부여 흐름은 손대지 않는다.

## UI 변경

### `MilestonesScreen.tsx`

```
- 무료 7종 row (현재 그대로)
- 분기:
  - isAllMilestoneVisible: false → 기존 PremiumLockedSection (현재 PremiumSection 코드)
  - isAllMilestoneVisible: true  → PremiumUnlockedSection
    - "Premium" 섹션 헤더
    - 선택 가능 7종을 MilestoneRow로 렌더 (라디오 + 라벨 + 진행률 + active 안내)
    - 범위 외 3종은 기존 카드 형태 유지 (정보만, 선택 불가) + "달성 시 호칭 부여" 캡션
- footnote (그대로)
```

### `MilestoneRow.tsx`

`buildActiveDescription` (현재 `MilestonesScreen.tsx`에 있는 헬퍼)에 새 분기 추가:

```ts
function buildActiveDescription(progress, t): ActiveDescription | null {
  if (progress.unsupportedReason === "needs_birth") return { kind: "needsBirth" };
  if (progress.unsupportedReason === "needs_home_country") return { kind: "needsHomeCountry" };
  if (progress.reachedFinal) return { kind: "completed" };
  // 기존 next 분기
}
```

`ActiveDescription` 타입을 확장:
```ts
type ActiveDescription =
  | { kind: "completed" }
  | { kind: "needsBirth" }
  | { kind: "needsHomeCountry" }
  | { kind: "next"; count: number; title: string; unit: MilestoneProgress["unit"] };
```

`renderDescription`의 i18n 분기를 단위별로 확장:

```ts
function renderDescription(desc, styles, t) {
  if (desc.kind === "completed")        return <Trans i18nKey="milestones.activeNext.completed" .../>;
  if (desc.kind === "needsBirth")       return <Trans i18nKey="milestones.activeNext.needsBirth" .../>;
  if (desc.kind === "needsHomeCountry") return <Trans i18nKey="milestones.activeNext.needsHomeCountry" .../>;
  // desc.kind === "next"
  const i18nKey = {
    countries: "milestones.activeNext.countries",
    days: "milestones.activeNext.days",
    months: "milestones.activeNext.months",
    colors: "milestones.activeNext.colors",
    languages: "milestones.activeNext.languages",
    percent: "milestones.activeNext.percent",
    hours: "milestones.activeNext.hours",
  }[desc.unit];
  return <Trans i18nKey={i18nKey} values={{ count: desc.count, title: desc.title }} .../>;
}
```

진행률 텍스트(`progressText`) 분기도 동일하게 확장 — `unsupportedReason`이 있을 때는 진행률 대신 빈 문자열을 반환하거나 placeholder 표시.

### 컴포넌트 분리 (CLAUDE.md §5)

새 파일:
- `src/screens/MilestonesScreen/PremiumLockedSection.tsx` — 현 `PremiumSection`을 그대로 이동 (이름만 변경)
- `src/screens/MilestonesScreen/PremiumUnlockedSection.tsx` — Premium 헤더 + 7개 row + 3개 정보 카드

기존 `PremiumSection.tsx`는 삭제(둘로 분리되므로).

새 파일:
- `src/features/milestone/premium/evaluatePremiumProgress.ts` — 7종 진행률 평가 함수

기존 파일 변경:
- `src/features/milestone/milestoneEvaluator.ts` — 시그니처 확장, premium 분기 위임
- `src/features/milestone/milestoneTypes.ts` — `MilestoneProgress.unit` 타입 확장
- `src/screens/MilestonesScreen.tsx` — 컨텍스트 빌드, 분기 렌더링
- `src/screens/MilestonesScreen/MilestoneRow.tsx` — 새 unit i18n 분기
- `src/screens/MainScreen/index.tsx` — `evaluateMilestone` 호출부 컨텍스트 전달
- `src/screens/MilestonesScreen/styles.ts` — Premium 섹션 헤더 스타일 추가 (필요시)

## i18n 키 추가

`src/i18n/locales/ko.json` 및 `en.json`(존재하는 모든 로케일):

**옵션 라벨 (7개)**:
```
milestones.option.premium_humanity
milestones.option.premium_earth_area
milestones.option.premium_calendar
milestones.option.premium_flag_palette
milestones.option.premium_un_linguist
milestones.option.premium_age_match
milestones.option.premium_round_the_clock
```

값은 기존 `milestones.premium.items.{id}.name`과 일치시킨다 (중복 노출 방지하되 키 경로는 분리하여 옵션 라벨/카드명 변경에 독립성 확보).

**다음 호칭 안내 (7개 신규)**:
```
milestones.activeNext.months
milestones.activeNext.colors
milestones.activeNext.languages
milestones.activeNext.percent
milestones.activeNext.hours
milestones.activeNext.needsBirth         // age_match birth 미설정
milestones.activeNext.needsHomeCountry   // calendar homeCountry 미설정
```

ko 예시:
- `months`: `<b>{{count}}개월</b> 더 채우면 <b>「{{title}}」</b>`
- `colors`: `<b>{{count}}색</b> 더 모으면 <b>「{{title}}」</b>`
- `languages`: `<b>{{count}}개 공용어</b> 더 추가하면 <b>「{{title}}」</b>`
- `percent`: `<b>{{count}}%</b> 더 채우면 <b>「{{title}}」</b>`
- `hours`: `<b>{{count}}시간</b> 시차를 더 넓히면 <b>「{{title}}」</b>`
- `needsBirth`: `프로필에 생일을 입력하면 진행률이 표시됩니다`
- `needsHomeCountry`: `본국이 설정되어야 진행률이 계산됩니다`

**진행률 단위 (5개 신규)**:
```
home.monthsUnit
home.colorsUnit
home.languagesUnit
home.percentUnit
home.hoursUnit
```

**Premium 섹션 (1개 신규)**:
```
milestones.premium.subsectionUnsupported   // 범위 외 3종 카드 캡션
```

ko: `달성 시 호칭이 자동 부여됩니다`

**총 신규 키 수**: 옵션 라벨 7 + activeNext 7 + 단위 5 + premium 캡션 1 = **20개** (각 로케일당)

## 테스트

### 새 테스트
- `src/features/milestone/premium/evaluatePremiumProgress.test.ts`
  - 각 7종에 대해:
    - 0% 진행: `current = 0, next = 첫 컷오프, percent = 0`
    - 중간: 정확한 percent 반환
    - 1차 컷오프 도달: `next = 2차 컷오프, percent ≈ current/next × 100`
    - 최종 도달: `reachedFinal = true, next = null`
  - `age_match`: `birth: null` 시 빈 진행률
  - `calendar`: `homeCountry: null` 시 빈 진행률
  - `round_the_clock`: 방문국 ≤ 1 시 `current = 0, next = 24`

### 기존 테스트 변경
- `src/features/milestone/milestoneTypes.test.ts` — `MilestoneProgress.unit` 새 단위 케이스 (해당 시)
- `src/features/milestone/milestoneStore.test.ts` (있다면) — 시그니처 확장에 맞춰 ctx 전달
- 기존 `evaluateMilestone` 테스트 — ctx wrapping 형태로 변환

### 수동 QA
- 무료 사용자: PremiumLockedSection 그대로 표시되는지 (회귀 없음)
- 유료 사용자:
  - 7종 row가 추가되고 라디오 선택 시 `setKind` 동작
  - 선택된 premium kind가 `MainScreen`에 진행률로 노출
  - active 시 "다음 호칭" 안내가 단위별로 정확히 표시
  - 범위 외 3종 카드는 선택 불가
  - 앱 재시작 후 premium kind 복원

## 마이그레이션 / 호환성

- 기존 무료 사용자 데이터: 변경 없음.
- 기존 유료 사용자 중 `milestoneStorage`에 premium kind가 이미 저장된 경우(이론상 진입점이 없었으므로 발생하지 않지만): `hydrate`에서 `isPremiumMilestoneKind` 체크가 그대로 동작하므로 영향 없음.
- 새 단위가 추가되어도 기존 `MilestoneProgress`를 받는 모든 곳은 union 확장만 적용된다. switch가 없는 곳은 영향 없음.

## 위험 / 고려사항

- **`MilestoneRow`의 `renderDescription` switch가 새 단위를 모두 다루지 못하면** 누락된 단위가 무성의하게 빈 텍스트로 렌더된다 → switch에 `assertNever` 가드 추가하여 컴파일 타임에 누락 잡기.
- **`age_match`의 `next` 컷오프가 동적**이라 사용자가 다음 단계 도달 직전에 생일이 지나면 `next` 값이 바뀐다 → 기존 호칭 부여 정책과 동일하게 평가 시점 기준으로만 계산. `MainScreen`이 다시 평가될 때 자연스럽게 반영.
- **`calendar`의 `current` 산식이 본국 필터 의존**이라 본국 변경 시 진행률이 변동할 수 있음 → 현 호칭 부여 정책과 동일.
- **i18n 키 누락**: 새 키 20개를 모든 로케일에 추가. 누락 시 fallback이 키 자체로 표시되므로 QA 단계에서 잡힘.

## 다음 단계

이 spec 승인 후 `writing-plans` skill로 구현 plan 작성.
