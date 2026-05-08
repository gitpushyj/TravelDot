# 여행 병합 (Trip Merge) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한 나라에 장기 체류했지만 사진을 매일 찍지 않아 여러 개의 짧은 여행으로 쪼개진 데이터를, (1) 첫 스캔 시 자동으로 gap ≤ 3일이면 합치고, (2) 사용자가 수동으로 다중 선택 병합할 수 있는 화면을 제공한다.

**Architecture:** "병합 = 빈 날짜를 `visit_days`에 채우기" 전략으로 스키마 변경 없이 기존 `loadAllTrips` 그룹핑 로직(연속 날짜만 묶음)이 자동으로 합쳐주도록 한다. 자동 병합은 `syncService.runSync` 시작 시 `visit_days`가 0개일 때만 실행되는 `bridgeNearbyVisitDays(3)` 호출로 구현. 수동 병합은 `CountryMergeScreen`에서 다중 선택 → `mergeTrips(countryCode, min(start), max(end))` 호출로 처리. 비인접(gap > 3) 선택 시 확인 팝업으로 한 번 더 묻는다.

**Tech Stack:** React Native (Expo) / TypeScript / SQLite (expo-sqlite) / React Navigation / zustand / i18next. 신규: jest + babel-jest (순수 함수 테스트용).

**참조 spec:** `docs/superpowers/specs/2026-05-08-trip-merge-design.md`

---

## Task 1: Jest 테스트 인프라 셋업

순수 TS 함수만 테스트. RN 컴포넌트는 테스트하지 않음.

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`
- Create: `src/__tests__/sanity.test.ts`

- [ ] **Step 1: jest 의존성 설치**

```bash
npm install --save-dev jest @types/jest babel-jest
```

- [ ] **Step 2: jest.config.js 작성**

```js
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  testMatch: ['**/?(*.)+(test).(ts|tsx)'],
  testPathIgnorePatterns: ['/node_modules/', '/ios/', '/android/'],
};
```

- [ ] **Step 3: package.json scripts 추가**

`"scripts"` 안에 `"test": "jest"` 한 줄 추가.

- [ ] **Step 4: sanity 테스트 작성**

```ts
// src/__tests__/sanity.test.ts
describe('jest sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 실행 확인**

Run: `npm test`
Expected: PASS, 1 test

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json jest.config.js src/__tests__/sanity.test.ts
git commit -m "chore: add jest setup for pure-TS unit tests"
```

---

## Task 2: dateUtils 분리 (refactor)

`internal.ts`는 SQLite 의존성(`getDb`)을 가지므로 jest에서 import할 수 없다. `diffInDays`/`addOneDay` 순수 함수를 별도 파일로 떼어내고 `internal.ts`는 re-export로 호환 유지.

**Files:**
- Create: `src/features/travel/visit/dateUtils.ts`
- Create: `src/features/travel/visit/dateUtils.test.ts`
- Modify: `src/features/travel/visit/internal.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// src/features/travel/visit/dateUtils.test.ts
import { addOneDay, diffInDays } from './dateUtils';

describe('diffInDays', () => {
  it('returns 0 for same day', () => {
    expect(diffInDays('2024-03-05', '2024-03-05')).toBe(0);
  });
  it('returns 1 for next day', () => {
    expect(diffInDays('2024-03-05', '2024-03-06')).toBe(1);
  });
  it('handles month boundary', () => {
    expect(diffInDays('2024-02-28', '2024-03-01')).toBe(2); // 2024 leap
  });
  it('handles year boundary', () => {
    expect(diffInDays('2023-12-31', '2024-01-01')).toBe(1);
  });
});

describe('addOneDay', () => {
  it('adds one day', () => {
    expect(addOneDay('2024-03-05')).toBe('2024-03-06');
  });
  it('rolls month', () => {
    expect(addOneDay('2024-03-31')).toBe('2024-04-01');
  });
  it('rolls leap-year february', () => {
    expect(addOneDay('2024-02-29')).toBe('2024-03-01');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test dateUtils`
Expected: FAIL — module not found

- [ ] **Step 3: dateUtils.ts 작성 (internal.ts에서 잘라옴)**

```ts
// src/features/travel/visit/dateUtils.ts
export function diffInDays(a: string, b: string): number {
  // YYYY-MM-DD 가정. UTC로 변환해 일수만 계산.
  const da = Date.UTC(
    Number(a.slice(0, 4)),
    Number(a.slice(5, 7)) - 1,
    Number(a.slice(8, 10))
  );
  const db = Date.UTC(
    Number(b.slice(0, 4)),
    Number(b.slice(5, 7)) - 1,
    Number(b.slice(8, 10))
  );
  return Math.round((db - da) / 86400000);
}

export function addOneDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
```

- [ ] **Step 4: internal.ts 변경 — re-export로 호환 유지**

```ts
// src/features/travel/visit/internal.ts
import { getDb } from "../db";

export { addOneDay, diffInDays } from "./dateUtils";

export async function ensureVisitDay(
  countryCode: string,
  date: string,
  now: number
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO visit_days (country_code, date, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(country_code, date) DO UPDATE SET
       updated_at = excluded.updated_at,
       deleted_at = NULL`,
    countryCode,
    date,
    now
  );
}
```

- [ ] **Step 5: 테스트 + 타입체크 통과 확인**

Run: `npm test dateUtils && npx tsc --noEmit`
Expected: PASS, no TS errors. 기존 코드(`trips.ts` 등)는 `internal.ts`의 re-export로 그대로 동작.

- [ ] **Step 6: Commit**

```bash
git add src/features/travel/visit/dateUtils.ts src/features/travel/visit/dateUtils.test.ts src/features/travel/visit/internal.ts
git commit -m "refactor(travel): split pure date utils out of internal.ts for testability"
```

---

## Task 3: computeBridgeFills 순수 함수 + 테스트

자동 병합의 핵심 로직 — visit_days 배열에서 "채워야 할 빈 날짜 목록"을 순수 계산. DB와 분리.

**Files:**
- Create: `src/features/travel/visit/bridgeFills.ts`
- Create: `src/features/travel/visit/bridgeFills.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// src/features/travel/visit/bridgeFills.test.ts
import { computeBridgeFills, type DayKey } from './bridgeFills';

const d = (countryCode: string, date: string): DayKey => ({ countryCode, date });

describe('computeBridgeFills', () => {
  it('returns empty for single day', () => {
    expect(computeBridgeFills([d('CN', '2024-03-01')], 3)).toEqual([]);
  });

  it('fills 1-day gap when threshold=3 (gap=2)', () => {
    expect(
      computeBridgeFills([d('CN', '2024-03-01'), d('CN', '2024-03-03')], 3)
    ).toEqual([d('CN', '2024-03-02')]);
  });

  it('fills 2-day gap when threshold=3 (gap=3)', () => {
    expect(
      computeBridgeFills([d('CN', '2024-03-01'), d('CN', '2024-03-04')], 3)
    ).toEqual([d('CN', '2024-03-02'), d('CN', '2024-03-03')]);
  });

  it('does NOT fill 3-day gap when threshold=3 (gap=4)', () => {
    expect(
      computeBridgeFills([d('CN', '2024-03-01'), d('CN', '2024-03-05')], 3)
    ).toEqual([]);
  });

  it('does not bridge across countries', () => {
    expect(
      computeBridgeFills([d('CN', '2024-03-01'), d('JP', '2024-03-02')], 3)
    ).toEqual([]);
  });

  it('handles unsorted input by sorting first', () => {
    expect(
      computeBridgeFills(
        [
          d('JP', '2024-04-03'),
          d('JP', '2024-04-01'),
          d('CN', '2024-03-03'),
          d('CN', '2024-03-01'),
        ],
        3
      )
    ).toEqual([d('CN', '2024-03-02'), d('JP', '2024-04-02')]);
  });

  it('handles consecutive days (no fill needed)', () => {
    expect(
      computeBridgeFills(
        [d('CN', '2024-03-01'), d('CN', '2024-03-02'), d('CN', '2024-03-03')],
        3
      )
    ).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test bridgeFills`
Expected: FAIL

- [ ] **Step 3: 구현**

```ts
// src/features/travel/visit/bridgeFills.ts
import { addOneDay, diffInDays } from "./dateUtils";

export type DayKey = { countryCode: string; date: string };

// 같은 국가에서 인접 visit_days 사이 gap이 2~thresholdDays이면
// 그 사이의 빈 날짜들을 채워야 할 후보로 반환한다.
// 입력은 정렬되어 있지 않아도 되며, 이 함수가 정렬한다.
export function computeBridgeFills(
  days: DayKey[],
  thresholdDays: number
): DayKey[] {
  const sorted = [...days].sort((a, b) => {
    if (a.countryCode !== b.countryCode) {
      return a.countryCode < b.countryCode ? -1 : 1;
    }
    return a.date < b.date ? -1 : 1;
  });
  const fills: DayKey[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (prev.countryCode !== cur.countryCode) continue;
    const gap = diffInDays(prev.date, cur.date);
    if (gap >= 2 && gap <= thresholdDays) {
      let cursor = addOneDay(prev.date);
      while (cursor < cur.date) {
        fills.push({ countryCode: cur.countryCode, date: cursor });
        cursor = addOneDay(cursor);
      }
    }
  }
  return fills;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test bridgeFills`
Expected: PASS, 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/features/travel/visit/bridgeFills.ts src/features/travel/visit/bridgeFills.test.ts
git commit -m "feat(travel): add computeBridgeFills pure function for trip merge"
```

---

## Task 4: merge.ts — DB wrapper 두 함수

**Files:**
- Create: `src/features/travel/visit/merge.ts`

- [ ] **Step 1: merge.ts 작성**

```ts
// src/features/travel/visit/merge.ts
import { getDb } from "../db";
import { computeBridgeFills, type DayKey } from "./bridgeFills";
import { addOneDay, ensureVisitDay } from "./internal";

// 자동 병합: 같은 국가에서 인접 visit_days 사이 gap이 2~thresholdDays이면
// 사이 빈 날짜를 visit_days로 채운다. 단일 transaction.
export async function bridgeNearbyVisitDays(
  thresholdDays: number = 3
): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ country_code: string; date: string }>(
    `SELECT country_code, date FROM visit_days
      WHERE deleted_at IS NULL
      ORDER BY country_code, date`
  );
  const days: DayKey[] = rows.map((r) => ({
    countryCode: r.country_code,
    date: r.date,
  }));
  const fills = computeBridgeFills(days, thresholdDays);
  if (fills.length === 0) return;
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const f of fills) {
      await ensureVisitDay(f.countryCode, f.date, now);
    }
  });
}

// 수동 병합: 지정 국가의 [startDate, endDate] 모든 날짜에 visit_days를 보장한다.
// 결과적으로 그 범위 안에 있던 분리된 trip들이 하나의 연속 trip으로 묶인다.
// `createTrip`과 본질적으로 같은 동작이지만, 도메인 의도(여행 병합)를 드러내기 위해 별도 export.
export async function mergeTrips(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<void> {
  if (startDate > endDate) {
    throw new Error("mergeTrips: startDate after endDate");
  }
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    let cur = startDate;
    while (cur <= endDate) {
      await ensureVisitDay(countryCode, cur, now);
      cur = addOneDay(cur);
    }
  });
}
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/features/travel/visit/merge.ts
git commit -m "feat(travel): add bridgeNearbyVisitDays and mergeTrips"
```

---

## Task 5: visitRepository barrel re-export

**Files:**
- Modify: `src/features/travel/visitRepository.ts`

- [ ] **Step 1: re-export 추가**

기존 export 블록 다음에 추가:

```ts
export {
  bridgeNearbyVisitDays,
  mergeTrips,
} from "./visit/merge";
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/features/travel/visitRepository.ts
git commit -m "feat(travel): expose merge functions via visitRepository barrel"
```

---

## Task 6: syncService에 자동 병합 통합

**Files:**
- Modify: `src/features/photoSync/syncService.ts`

- [ ] **Step 1: import 추가**

`runSync` 함수가 정의된 파일 상단의 import 블록에 추가:

```ts
import {
  addPhotos,
  bridgeNearbyVisitDays,
  loadLatestVisitDate,
  PHOTO_LIMIT_PER_DAY,
  VisitPhotoInput,
} from "../travel/visitRepository";
import { getDb } from "../travel/db";
```

(`getDb`는 새 import. 나머지는 기존)

- [ ] **Step 2: `runSync` 시작 부분에 isFirstScan 가드 추가**

`runSync` 함수의 첫 줄들 (`const store = useVisitStore.getState();` 다음 줄)에:

```ts
// 첫 스캔 여부를 사진 추가 *전에* 평가한다 — 사진 추가 후에는 visit_days가
// 채워져 더 이상 "첫 스캔"이 아니게 되기 때문.
const dbHandle = await getDb();
const existing = await dbHandle.getFirstAsync<{ x: number }>(
  `SELECT 1 AS x FROM visit_days WHERE deleted_at IS NULL LIMIT 1`
);
const isFirstScan = existing == null;
```

- [ ] **Step 3: addPhotos 호출 직후, refreshVisits 직전에 자동 병합 호출**

기존:
```ts
const added = await addPhotos(all);
await useVisitStore.getState().refreshVisits();
```

변경 후:
```ts
const added = await addPhotos(all);
// 첫 스캔이면 인접한 trip을 자동으로 묶는다 (gap ≤ 3일 한정).
// 이후 스캔에서는 사용자의 수동 결정을 보존하기 위해 실행하지 않는다.
if (isFirstScan) {
  await bridgeNearbyVisitDays(3);
}
await useVisitStore.getState().refreshVisits();
```

- [ ] **Step 4: 타입체크 + lint**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 수동 검증 시나리오**

다음 두 케이스를 실기기 또는 시뮬레이터에서 확인:

(a) 자동 병합 ON 케이스: 데이터를 초기화한 뒤 (Settings의 wipe 또는 DB 파일 삭제), 한 달 동안 2~3일 간격으로 같은 국가 사진들을 두고 onboarding 스캔. CountryDetailScreen에서 1개의 연속 trip으로 보여야 함.

(b) 자동 병합 OFF 케이스: 데이터가 있는 상태에서 incremental sync (또는 Settings의 "전체 재스캔"). 기존 trip 분할이 그대로 유지되어야 함.

- [ ] **Step 6: Commit**

```bash
git add src/features/photoSync/syncService.ts
git commit -m "feat(photoSync): auto-bridge nearby trips on first scan only"
```

---

## Task 7: CountryMergeScreen utils + jest 테스트

**Files:**
- Create: `src/screens/CountryMergeScreen/utils.ts`
- Create: `src/screens/CountryMergeScreen/utils.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
// src/screens/CountryMergeScreen/utils.test.ts
import {
  containsNonAdjacentGap,
  gapBetween,
  maxGapDays,
} from './utils';
import type { RecentTrip } from '../../features/travel/visitRepository';

const t = (startDate: string, endDate: string, days = 1): RecentTrip => ({
  countryCode: 'CN',
  startDate,
  endDate,
  days,
});

describe('gapBetween', () => {
  it('returns 1 for back-to-back', () => {
    expect(gapBetween('2024-03-05', '2024-03-06')).toBe(1);
  });
  it('returns gap days', () => {
    expect(gapBetween('2024-03-05', '2024-03-09')).toBe(4);
  });
});

describe('containsNonAdjacentGap (threshold=3)', () => {
  it('false for two adjacent trips (gap=2)', () => {
    expect(
      containsNonAdjacentGap([t('2024-03-01', '2024-03-03'), t('2024-03-05', '2024-03-07')], 3)
    ).toBe(false);
  });
  it('false at gap=3 boundary', () => {
    expect(
      containsNonAdjacentGap([t('2024-03-01', '2024-03-03'), t('2024-03-06', '2024-03-08')], 3)
    ).toBe(false);
  });
  it('true at gap=4', () => {
    expect(
      containsNonAdjacentGap([t('2024-03-01', '2024-03-03'), t('2024-03-07', '2024-03-09')], 3)
    ).toBe(true);
  });
  it('reorders by startDate before checking', () => {
    expect(
      containsNonAdjacentGap([t('2024-03-10', '2024-03-12'), t('2024-03-01', '2024-03-03')], 3)
    ).toBe(true);
  });
  it('false for fewer than 2 trips', () => {
    expect(containsNonAdjacentGap([t('2024-03-01', '2024-03-03')], 3)).toBe(false);
  });
});

describe('maxGapDays', () => {
  it('returns largest gap', () => {
    expect(
      maxGapDays([
        t('2024-03-01', '2024-03-03'),
        t('2024-03-10', '2024-03-12'), // gap=7
        t('2024-03-15', '2024-03-16'), // gap=3
      ])
    ).toBe(7);
  });
  it('returns 0 for fewer than 2 trips', () => {
    expect(maxGapDays([t('2024-03-01', '2024-03-03')])).toBe(0);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test CountryMergeScreen/utils`
Expected: FAIL

- [ ] **Step 3: 구현**

```ts
// src/screens/CountryMergeScreen/utils.ts
import { diffInDays } from "../../features/travel/visit/dateUtils";
import type { RecentTrip } from "../../features/travel/visitRepository";

// 두 trip 사이 일수 차이. prev의 endDate와 next의 startDate 간격.
// 1 = 바로 다음날 (사이 빈 날 0), 2 = 사이 1일 빔, ...
export function gapBetween(prevEndDate: string, nextStartDate: string): number {
  return diffInDays(prevEndDate, nextStartDate);
}

// startDate 오름차순 정렬 후 인접 gap 중 하나라도 adjacentThreshold 초과면 true.
export function containsNonAdjacentGap(
  trips: RecentTrip[],
  adjacentThreshold: number
): boolean {
  if (trips.length < 2) return false;
  const sorted = [...trips].sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  for (let i = 1; i < sorted.length; i += 1) {
    if (gapBetween(sorted[i - 1].endDate, sorted[i].startDate) > adjacentThreshold) {
      return true;
    }
  }
  return false;
}

// startDate 오름차순 정렬 후 인접 gap의 최댓값. 2개 미만이면 0.
export function maxGapDays(trips: RecentTrip[]): number {
  if (trips.length < 2) return 0;
  const sorted = [...trips].sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  let max = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = gapBetween(sorted[i - 1].endDate, sorted[i].startDate);
    if (gap > max) max = gap;
  }
  return max;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npm test CountryMergeScreen/utils`
Expected: PASS, 9 tests

- [ ] **Step 5: Commit**

```bash
git add src/screens/CountryMergeScreen/utils.ts src/screens/CountryMergeScreen/utils.test.ts
git commit -m "feat(merge): add CountryMergeScreen utils for gap calculation"
```

---

## Task 8: i18n 키 추가

**Files:**
- Modify: `src/i18n/locales/ko.json`
- Modify: `src/i18n/locales/en.json`
- Modify: 다른 8개 locale 파일들 (de, es, fr, it, ja, ru, zh-CN, zh-TW) — 영어 fallback 사용

- [ ] **Step 1: ko.json에 키 추가**

기존 JSON 안에 다음 블록 추가 (적절한 위치, 예: `history` 섹션 뒤):

```json
"merge": {
  "title": "{{country}} 여행 병합",
  "subtitle": "병합할 여행을 선택하세요",
  "gapLabel": "{{days}}일 간격",
  "selectedCount": "{{count}}개 선택됨",
  "actionMerge": "병합",
  "confirmGapTitle": "정말 하나의 여행인가요?",
  "confirmGapBody": "선택한 여행 사이에 최대 {{days}}일의 공백이 있어요. 정말 하나의 여행으로 합칠까요?"
}
```

`countryDetail` 섹션 안에 추가:
```json
"mergeButton": "병합 ▸"
```

`history` 섹션 안에 추가:
```json
"mergeHint": "동일한 여행인가요? 병합하러 가기 ▸"
```

- [ ] **Step 2: en.json에 같은 키 영어 번역**

```json
"merge": {
  "title": "Merge {{country}} trips",
  "subtitle": "Select trips to merge",
  "gapLabel": "{{days}}-day gap",
  "selectedCount": "{{count}} selected",
  "actionMerge": "Merge",
  "confirmGapTitle": "Really one trip?",
  "confirmGapBody": "There is up to a {{days}}-day gap between selected trips. Merge them into one trip anyway?"
}
```

`countryDetail.mergeButton` → `"Merge ▸"`
`history.mergeHint` → `"Same trip? Tap to merge ▸"`

- [ ] **Step 3: 나머지 8개 locale에 영어 텍스트 그대로 복사**

en.json의 동일 블록을 그대로 붙여넣기. fallback 없이도 화면이 깨지지 않도록.

- [ ] **Step 4: 앱 빌드 후 키 누락 없는지 확인**

Run: `npx tsc --noEmit && grep -r "i18n.t.*merge\." src/ || true`
(참고: 이 단계는 후속 task에서 키를 사용하므로 task 14까지 끝난 뒤 한 번 더 확인)

- [ ] **Step 5: Commit**

```bash
git add src/i18n/locales/
git commit -m "i18n: add trip merge text keys"
```

---

## Task 9: GapDivider 컴포넌트

**Files:**
- Create: `src/screens/CountryMergeScreen/GapDivider.tsx`
- Create: `src/screens/CountryMergeScreen/styles.ts`

- [ ] **Step 1: styles.ts 기본 골격 작성**

기존 `HistoryScreen/styles.ts` 패턴 참고:

```ts
// src/screens/CountryMergeScreen/styles.ts
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
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 17,
      fontWeight: "600",
      color: theme.text,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    iconBtnText: { fontSize: 22, color: theme.text },
    iconBtnPlaceholder: { width: 40, height: 40 },
    subtitle: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
      fontSize: 13,
      color: theme.textSubtle,
    },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    rowSep: { height: 8 },
    nonAdjacentSpacer: { height: 24 }, // 비인접 사이의 추가 여백
    gapDivider: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
    },
    gapLine: {
      flex: 1,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.divider,
      borderStyle: "dashed",
    },
    gapLabel: {
      paddingHorizontal: 8,
      fontSize: 12,
      color: theme.textSubtle,
    },
    bottomBar: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 24,
      backgroundColor: theme.homeBg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.divider,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectedCount: { fontSize: 14, color: theme.text },
    mergeBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.primaryBg,
    },
    mergeBtnDisabled: { opacity: 0.4 },
    mergeBtnText: { color: theme.primaryFg, fontSize: 15, fontWeight: "600" },
    emptyWrap: { paddingTop: 60, alignItems: "center" },
    emptyText: { color: theme.textSubtle, fontSize: 14 },
  });
}
```

(참고: `theme.divider`, `theme.primaryBg`, `theme.primaryFg`, `theme.textSubtle` 등의 정확한 속성명은 `src/theme/theme.ts`를 보고 일치시킬 것. 기존 화면들에서 사용 중인 이름을 그대로 사용.)

- [ ] **Step 2: GapDivider 컴포넌트 작성**

```tsx
// src/screens/CountryMergeScreen/GapDivider.tsx
import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

type Props = { theme: Theme; days: number };

export default function GapDivider({ theme, days }: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View>
      <View style={styles.nonAdjacentSpacer} />
      <View style={styles.gapDivider}>
        <View style={styles.gapLine} />
        <Text style={styles.gapLabel}>{t("merge.gapLabel", { days })}</Text>
        <View style={styles.gapLine} />
      </View>
      <View style={styles.nonAdjacentSpacer} />
    </View>
  );
}
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add src/screens/CountryMergeScreen/styles.ts src/screens/CountryMergeScreen/GapDivider.tsx
git commit -m "feat(merge): add GapDivider component for non-adjacent boundary"
```

---

## Task 10: TripCheckRow 컴포넌트

**Files:**
- Create: `src/screens/CountryMergeScreen/TripCheckRow.tsx`
- Modify: `src/screens/CountryMergeScreen/styles.ts` (체크박스 행 스타일 추가)

- [ ] **Step 1: styles.ts에 행 스타일 추가**

기존 styles에 다음을 추가:

```ts
checkRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 12,
  backgroundColor: theme.cardBg,
  borderWidth: 1,
  borderColor: theme.cardBorder,
},
checkRowSelected: {
  backgroundColor: theme.cardBgActive,
  borderColor: theme.primaryBg,
},
checkbox: {
  width: 22,
  height: 22,
  borderRadius: 11,
  borderWidth: 2,
  borderColor: theme.cardBorder,
  marginRight: 12,
  alignItems: "center",
  justifyContent: "center",
},
checkboxOn: {
  backgroundColor: theme.primaryBg,
  borderColor: theme.primaryBg,
},
checkboxMark: { color: theme.primaryFg, fontSize: 14, fontWeight: "700" },
rowMain: { flex: 1 },
rowDate: { fontSize: 15, fontWeight: "600", color: theme.text },
rowSub: { marginTop: 2, fontSize: 12, color: theme.textSubtle },
```

- [ ] **Step 2: TripCheckRow 컴포넌트 작성**

```tsx
// src/screens/CountryMergeScreen/TripCheckRow.tsx
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { TripWithPhotos } from "../../features/travel/visitRepository";
import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  trip: TripWithPhotos;
  selected: boolean;
  onToggle: () => void;
};

function formatMD(date: string): string {
  const [, m, d] = date.split("-");
  return `${m}.${d}`;
}

export default function TripCheckRow({ theme, trip, selected, onToggle }: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const range =
    trip.startDate === trip.endDate
      ? formatMD(trip.startDate)
      : `${formatMD(trip.startDate)} — ${formatMD(trip.endDate)}`;
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.checkRow, selected && styles.checkRowSelected]}
    >
      <View style={[styles.checkbox, selected && styles.checkboxOn]}>
        {selected && <Text style={styles.checkboxMark}>✓</Text>}
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowDate}>{range}</Text>
        <Text style={styles.rowSub}>
          {t("countryDetail.tripDuration", { days: trip.days })}
          {trip.photos > 0
            ? ` · ${t("countryDetail.tripPhotos", { count: trip.photos })}`
            : ""}
        </Text>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 4: Commit**

```bash
git add src/screens/CountryMergeScreen/TripCheckRow.tsx src/screens/CountryMergeScreen/styles.ts
git commit -m "feat(merge): add TripCheckRow component"
```

---

## Task 11: CountryMergeScreen 컨테이너

선택 state, 데이터 로드, 리스트 렌더 (인접/비인접 경계 처리). 액션은 Task 12에서.

**Files:**
- Create: `src/screens/CountryMergeScreen.tsx`

- [ ] **Step 1: 컨테이너 작성**

```tsx
// src/screens/CountryMergeScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  countPhotosForTrip,
  loadTripsForCountry,
  mergeTrips,
  type RecentTrip,
  type TripWithPhotos,
} from "../features/travel/visitRepository";
import { useVisitStore } from "../features/travel/visitStore";
import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { getCurrentLocale } from "../i18n";
import { getCountryName } from "../lib/countryName";
import { useTheme } from "../theme/themeStore";

import GapDivider from "./CountryMergeScreen/GapDivider";
import TripCheckRow from "./CountryMergeScreen/TripCheckRow";
import { makeStyles } from "./CountryMergeScreen/styles";
import {
  containsNonAdjacentGap,
  gapBetween,
  maxGapDays,
} from "./CountryMergeScreen/utils";

const ADJACENT_THRESHOLD = 3;

type Props = { countryCode: string; onClose: () => void };

type ListItem =
  | { kind: "trip"; trip: TripWithPhotos }
  | { kind: "gap"; days: number; key: string };

function tripKey(trip: RecentTrip): string {
  return `${trip.countryCode}|${trip.startDate}|${trip.endDate}`;
}

export default function CountryMergeScreen({ countryCode, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();
  const refreshVisits = useVisitStore((s) => s.refreshVisits);

  const [trips, setTrips] = useState<TripWithPhotos[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const reload = async () => {
    const raw = await loadTripsForCountry(countryCode);
    const counts = await Promise.all(
      raw.map((tr) => countPhotosForTrip(tr.countryCode, tr.startDate, tr.endDate))
    );
    setTrips(raw.map((tr, i) => ({ ...tr, photos: counts[i] })));
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = await loadTripsForCountry(countryCode);
      const counts = await Promise.all(
        raw.map((tr) => countPhotosForTrip(tr.countryCode, tr.startDate, tr.endDate))
      );
      if (cancelled) return;
      setTrips(raw.map((tr, i) => ({ ...tr, photos: counts[i] })));
    })();
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  // 화면에 보여줄 리스트 — 시간순 (DESC) trip 사이에 비인접 GapDivider 삽입.
  // loadTripsForCountry는 이미 startDate DESC. 인접/비인접은 위 trip의 startDate와
  // 아래 trip의 endDate 사이의 gap으로 판정 (DESC 순서이므로 prev=위=더 늦은 trip).
  const items: ListItem[] = useMemo(() => {
    if (!trips) return [];
    const out: ListItem[] = [];
    for (let i = 0; i < trips.length; i += 1) {
      out.push({ kind: "trip", trip: trips[i] });
      if (i < trips.length - 1) {
        const upper = trips[i]; // 더 늦은 trip
        const lower = trips[i + 1]; // 더 이른 trip
        const gap = gapBetween(lower.endDate, upper.startDate);
        if (gap > ADJACENT_THRESHOLD) {
          out.push({ kind: "gap", days: gap, key: `gap-${i}` });
        }
      }
    }
    return out;
  }, [trips]);

  const selectedTrips = useMemo<TripWithPhotos[]>(() => {
    if (!trips) return [];
    return trips.filter((tr) => selected.has(tripKey(tr)));
  }, [trips, selected]);

  const toggle = (trip: RecentTrip) => {
    const k = tripKey(trip);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const canMerge = selectedTrips.length >= 2;

  // 병합 액션은 Task 12에서 onMerge 핸들러로 채움.
  const onMerge = () => {
    // placeholder, Task 12에서 구현
  };

  const countryName = getCountryName(countryCode, getCurrentLocale());

  return (
    <View style={[styles.root, { paddingBottom: bottomInset }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t("merge.title", { country: countryName })}
        </Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <Text style={styles.subtitle}>{t("merge.subtitle")}</Text>

      {trips == null ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t("common.loading")}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) =>
            it.kind === "trip" ? tripKey(it.trip) : it.key
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.rowSep} />}
          renderItem={({ item }) => {
            if (item.kind === "gap") {
              return <GapDivider theme={theme} days={item.days} />;
            }
            return (
              <TripCheckRow
                theme={theme}
                trip={item.trip}
                selected={selected.has(tripKey(item.trip))}
                onToggle={() => toggle(item.trip)}
              />
            );
          }}
        />
      )}

      <View style={styles.bottomBar}>
        <Text style={styles.selectedCount}>
          {t("merge.selectedCount", { count: selectedTrips.length })}
        </Text>
        <Pressable
          disabled={!canMerge}
          onPress={onMerge}
          style={[styles.mergeBtn, !canMerge && styles.mergeBtnDisabled]}
        >
          <Text style={styles.mergeBtnText}>{t("merge.actionMerge")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: Commit**

```bash
git add src/screens/CountryMergeScreen.tsx
git commit -m "feat(merge): add CountryMergeScreen container with selection state"
```

---

## Task 12: 병합 액션 + 비인접 확인 팝업

**Files:**
- Modify: `src/screens/CountryMergeScreen.tsx`

- [ ] **Step 1: `onMerge` 핸들러 구현**

Task 11의 placeholder `onMerge`를 다음으로 교체:

```tsx
const performMerge = async () => {
  if (selectedTrips.length < 2) return;
  const sorted = [...selectedTrips].sort((a, b) =>
    a.startDate < b.startDate ? -1 : 1
  );
  const start = sorted[0].startDate;
  const end = sorted[sorted.length - 1].endDate;
  await mergeTrips(countryCode, start, end);
  setSelected(new Set());
  await reload();
  await refreshVisits();
};

const onMerge = () => {
  if (containsNonAdjacentGap(selectedTrips, ADJACENT_THRESHOLD)) {
    const days = maxGapDays(selectedTrips);
    Alert.alert(
      t("merge.confirmGapTitle"),
      t("merge.confirmGapBody", { days }),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("merge.actionMerge"), onPress: () => void performMerge() },
      ]
    );
    return;
  }
  void performMerge();
};
```

(`Alert`, `mergeTrips`, `containsNonAdjacentGap`, `maxGapDays`는 이미 import 되어 있음.)

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 수동 검증 시나리오**

(a) 인접 trip 2개 선택 후 병합 → 즉시 합쳐짐, 리스트에 1개 trip으로 보임
(b) 비인접 포함 선택 후 병합 → 확인 팝업 뜸 → "병합" 시 합쳐짐
(c) "취소" 시 그대로 유지
(d) 1개만 선택 시 병합 버튼 비활성

- [ ] **Step 4: Commit**

```bash
git add src/screens/CountryMergeScreen.tsx
git commit -m "feat(merge): wire up merge action with non-adjacent confirm dialog"
```

---

## Task 13: Navigation 라우트 등록

**Files:**
- Modify: `src/navigation/types.ts`
- Modify: `src/navigation/RootNavigator.tsx`
- Create: `src/navigation/screens/CountryMergeScreenNav.tsx`

- [ ] **Step 1: types.ts에 라우트 추가**

```ts
// 기존 RootStackParamList 안에 한 줄 추가:
CountryMerge: { countryCode: string };
```

- [ ] **Step 2: CountryMergeScreenNav.tsx 작성**

기존 `CountryDetailScreenNav.tsx` 패턴 그대로:

```tsx
// src/navigation/screens/CountryMergeScreenNav.tsx
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import CountryMergeScreen from "../../screens/CountryMergeScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function CountryMergeScreenNav({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "CountryMerge">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <CountryMergeScreen
        countryCode={route.params.countryCode}
        onClose={() => navigation.goBack()}
      />
    </>
  );
}
```

- [ ] **Step 3: RootNavigator.tsx에 라우트 등록**

기존 `<Stack.Screen ... />` 블록들 옆에 한 줄 추가:

```tsx
import CountryMergeScreenNav from "./screens/CountryMergeScreenNav";
// ...
<Stack.Screen name="CountryMerge" component={CountryMergeScreenNav} />
```

- [ ] **Step 4: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: Commit**

```bash
git add src/navigation/types.ts src/navigation/RootNavigator.tsx src/navigation/screens/CountryMergeScreenNav.tsx
git commit -m "feat(nav): register CountryMerge route"
```

---

## Task 14: CountryDetailScreen에 병합 버튼

섹션 헤더("여행" 옆 "최신순" 옆에) "병합 ▸" 텍스트 버튼. trips ≥ 2 + editMode 비활성일 때만.

**Files:**
- Modify: `src/screens/CountryDetailScreen.tsx`
- Modify: `src/screens/CountryDetailScreen/styles.ts`

- [ ] **Step 1: navigation prop 받도록 시그니처 확장**

기존 `Props`에 추가:
```ts
type Props = {
  onClose: () => void;
  onSelectTrip?: (trip: RecentTrip) => void;
  onMergeTrips?: (countryCode: string) => void;
};
```

(상위 nav wrapper인 `CountryDetailScreenNav`에서 `() => navigation.navigate("CountryMerge", { countryCode })`로 채움)

- [ ] **Step 2: 섹션 헤더 영역에 버튼 삽입**

기존:
```tsx
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>{t("countryDetail.sectionTrips")}</Text>
  {editMode ? (...) : (
    <Text style={styles.sortLabel}>{t("countryDetail.sortLatest")}</Text>
  )}
</View>
```

로 변경:
```tsx
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>{t("countryDetail.sectionTrips")}</Text>
  {editMode ? (
    <Text style={styles.editHint}>{t("countryDetail.swipeToDelete")}</Text>
  ) : (
    <View style={styles.sectionHeaderRight}>
      {(trips?.length ?? 0) >= 2 && (
        <Pressable
          onPress={() => onMergeTrips?.(selectedCountry.code)}
          hitSlop={6}
          style={styles.mergeBtn}
        >
          <Text style={styles.mergeBtnText}>{t("countryDetail.mergeButton")}</Text>
        </Pressable>
      )}
      <Text style={styles.sortLabel}>{t("countryDetail.sortLatest")}</Text>
    </View>
  )}
</View>
```

- [ ] **Step 3: styles.ts에 새 스타일 추가**

```ts
sectionHeaderRight: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
},
mergeBtn: {
  paddingHorizontal: 4,
  paddingVertical: 2,
},
mergeBtnText: {
  fontSize: 13,
  color: theme.primaryFg, // 또는 기존 link 색상
  fontWeight: "500",
},
```

- [ ] **Step 4: CountryDetailScreenNav.tsx에서 onMergeTrips 핸들러 전달**

```tsx
<CountryDetailScreen
  onClose={() => navigation.goBack()}
  onSelectTrip={(trip) => navigation.navigate("TripDetail", { trip })}
  onMergeTrips={(countryCode) => navigation.navigate("CountryMerge", { countryCode })}
/>
```

- [ ] **Step 5: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 6: Commit**

```bash
git add src/screens/CountryDetailScreen.tsx src/screens/CountryDetailScreen/styles.ts src/navigation/screens/CountryDetailScreenNav.tsx
git commit -m "feat(country-detail): add merge button to trips section header"
```

---

## Task 15: HistoryScreen merge hint 링크

**Files:**
- Modify: `src/screens/HistoryScreen.tsx`
- Modify: `src/screens/HistoryScreen/TripRow.tsx`
- Modify: `src/screens/HistoryScreen/styles.ts`

- [ ] **Step 1: HistoryScreen에 hint 계산 함수 + 호출 추가**

`HistoryScreen.tsx` 상단 import에 추가:
```ts
import { diffInDays } from "../features/travel/visit/dateUtils";
```

(`CountryMergeScreen/utils.ts`의 함수를 cross-screen import하지 않고 `diffInDays`만 가져와 hint 전용 로직을 같은 파일에 inline. 화면 경계가 명확해짐.)

같은 파일 안에 export 안 한 헬퍼 정의:

```ts
const HINT_MIN = 4;
const HINT_MAX = 7;

function tripKey(t: TripWithPhotos): string {
  return `${t.countryCode}|${t.startDate}|${t.endDate}`;
}

function computeMergeHints(trips: TripWithPhotos[]): Set<string> {
  const hints = new Set<string>();
  const byCountry = new Map<string, TripWithPhotos[]>();
  for (const tr of trips) {
    const list = byCountry.get(tr.countryCode) ?? [];
    list.push(tr);
    byCountry.set(tr.countryCode, list);
  }
  for (const list of byCountry.values()) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        const gap =
          a.endDate < b.startDate
            ? diffInDays(a.endDate, b.startDate)
            : diffInDays(b.endDate, a.startDate);
        if (gap >= HINT_MIN && gap <= HINT_MAX) {
          hints.add(tripKey(a));
          hints.add(tripKey(b));
        }
      }
    }
  }
  return hints;
}
```

`HistoryScreen` 컴포넌트 안에서:
```ts
const hintSet = useMemo(() => computeMergeHints(trips ?? []), [trips]);
```

`Props`에 `onMergeHint` 추가:
```ts
type Props = {
  onClose: () => void;
  onSelectTrip: (trip: RecentTrip) => void;
  onMergeHint: (countryCode: string) => void;
};
```

`renderItem`에서 prop 전달:
```tsx
<TripRow
  theme={theme}
  trip={item}
  showMergeHint={hintSet.has(tripKey(item))}
  onPress={() => onSelectTrip({
    countryCode: item.countryCode,
    startDate: item.startDate,
    endDate: item.endDate,
    days: item.days,
  })}
  onMergeHintPress={() => onMergeHint(item.countryCode)}
/>
```

- [ ] **Step 2: TripRow에 hint 영역 추가**

기존 `TripRow.tsx`의 `Pressable` 안 구조를 다음으로 확장 (`showMergeHint`/`onMergeHintPress` prop 추가):

```tsx
type Props = {
  theme: Theme;
  trip: TripWithPhotos;
  showMergeHint: boolean;
  onPress: () => void;
  onMergeHintPress: () => void;
};
```

JSX는 외곽을 `View`로 감싸고, 기존 row를 본문, 그 아래 hint 영역을 두 번째 `Pressable`로:

```tsx
return (
  <View style={styles.rowWrap}>
    <Pressable onPress={onPress} style={({ pressed }) => [...]}>
      {/* 기존 row 내용 */}
    </Pressable>
    {showMergeHint && (
      <Pressable onPress={onMergeHintPress} style={styles.hintRow}>
        <View style={styles.hintDivider} />
        <Text style={styles.hintText}>{t("history.mergeHint")}</Text>
      </Pressable>
    )}
  </View>
);
```

- [ ] **Step 3: HistoryScreen/styles.ts에 hint 스타일 추가**

```ts
rowWrap: { /* 외곽 컨테이너용 — 기존 row와 hint를 묶음 */ },
hintRow: {
  paddingHorizontal: 16,
  paddingTop: 8,
  paddingBottom: 12,
},
hintDivider: {
  height: StyleSheet.hairlineWidth,
  backgroundColor: theme.divider,
  marginBottom: 8,
},
hintText: {
  fontSize: 12,
  color: theme.textSubtle,
},
```

- [ ] **Step 4: HistoryScreenNav에서 onMergeHint 핸들러 전달**

`src/navigation/screens/HistoryScreenNav.tsx`의 `<HistoryScreen ... />`에 prop 추가:

```tsx
<HistoryScreen
  onClose={() => navigation.goBack()}
  onSelectTrip={(trip) => navigation.navigate("TripDetail", { trip })}
  onMergeHint={(countryCode) => navigation.navigate("CountryMerge", { countryCode })}
/>
```

- [ ] **Step 5: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 6: 수동 검증**

(a) 같은 국가의 두 trip이 4~7일 간격일 때 양쪽 trip 모두 hint 링크 보임
(b) gap=3 trip은 hint 안 뜸 (이미 자동 병합 대상이거나 인접)
(c) gap=8 trip은 hint 안 뜸
(d) hint 링크 탭 → 해당 국가의 CountryMergeScreen 진입
(e) row 본문 탭 → 기존대로 trip 디테일 진입 (탭 영역이 분리되어야 함)

- [ ] **Step 7: Commit**

```bash
git add src/screens/HistoryScreen.tsx src/screens/HistoryScreen/TripRow.tsx src/screens/HistoryScreen/styles.ts
git commit -m "feat(history): add merge hint link for nearby same-country trips"
```

---

## Task 16: 최종 통합 검증

테스트 런 + 타입체크 + 실기기 시나리오 모두 통과 확인.

- [ ] **Step 1: 모든 jest 테스트 실행**

Run: `npm test`
Expected: PASS — sanity, dateUtils, bridgeFills, CountryMergeScreen/utils 모두 통과

- [ ] **Step 2: TypeScript 전체 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 3: 실기기 end-to-end 시나리오**

(a) **자동 병합 (첫 스캔)**:
- 데이터 wipe → 한 달 동안 2~3일 간격 시드 사진 → onboarding 스캔
- 결과: 한 국가에 1개의 연속 trip

(b) **자동 병합 OFF (incremental sync)**:
- 데이터 있는 상태에서 새 사진을 추가하고 incremental sync
- 결과: 새 trip이 기존 trip과 자동 합쳐지지 않음 (사용자가 수동으로 병합)

(c) **수동 병합 — CountryDetail 진입**:
- CountryDetail의 "병합 ▸" 버튼 → CountryMergeScreen
- 다중 선택 → 인접만이면 즉시 병합 / 비인접 포함이면 확인 팝업

(d) **수동 병합 — History 링크 진입**:
- 같은 국가의 4~7일 간격 trip이 있을 때 hint 링크 노출
- 탭 → CountryMergeScreen 진입 후 동일하게 동작

(e) **edge cases**:
- trip 1개만 있는 국가에서 CountryDetail에 "병합 ▸" 안 보임
- editMode 시 "병합 ▸" 안 보임
- 모든 trip 선택해서 병합해도 정상 동작 (한 trip만 남음)

- [ ] **Step 4: 최종 commit (필요 시)**

수정 사항이 더 있으면 별도 commit. 없으면 skip.

---

## 회귀 위험 요약

- `internal.ts` 분리: `addOneDay`/`diffInDays`를 사용 중인 모든 파일은 re-export로 그대로 동작. 단, **`internal.ts`를 직접 import하는 파일이 누락될 경우 빌드 실패**할 수 있으니 Task 2 Step 5의 `tsc --noEmit`으로 확인 필수.
- `syncService` 변경: 첫 스캔 판정이 잘못되면 (a) 진짜 첫 스캔에 자동 병합이 안 되거나 (b) 평소 sync에서 잘못 병합될 위험. `isFirstScan`이 `addPhotos`보다 *전에* 평가되어야 한다는 점 주의.
- `mergeTrips`는 `createTrip`과 사실상 같은 동작 — 별도 함수로 분리한 것은 의도 표현용. 미래에 분리 기능을 도입할 때 두 함수가 다른 의미를 가져야 하므로 합치지 말 것.

## Out of Scope

- 여행 분리 (split) 기능
- 병합 취소(undo)
- 자동 병합 임계값 사용자 설정
- 병합 화면 내 인접 trip 자동 그룹 미리보기
