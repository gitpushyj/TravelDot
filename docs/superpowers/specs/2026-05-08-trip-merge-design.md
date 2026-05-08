# 여행 병합 (Trip Merge) Design Spec

**작성일**: 2026-05-08
**목적**: 한 나라에 장기 체류했지만 사진을 매일 찍지 않아 여러 개의 짧은 여행으로 쪼개져 보이는 문제를 해결한다.

---

## 1. 배경

`visit_days` 테이블에 (국가, 날짜) 단위로 방문일이 저장되고, "여행"은 같은 국가에서 **정확히 연속된** 날짜의 묶음으로 계산된다 (`src/features/travel/visit/trips.ts`의 `diffInDays(prev, cur) === 1`).

사진 자동 스캔은 사진이 있는 날짜만 `visit_days`로 등록한다. 따라서 한 달 체류 중 2~3일 간격으로 사진을 찍은 사용자는 한 나라 안에서 10~15개의 짧은 여행으로 보이게 된다.

## 2. 해결 전략

**병합의 정의**: "여행 X와 Y를 병합" = X.endDate와 Y.startDate 사이의 빈 날짜들을 모두 `visit_days`에 추가한다. 그러면 기존 그룹핑 로직(`loadAllTrips` 등)이 자동으로 하나의 여행으로 묶어준다. **스키마 변경 없음.**

병합으로 채워진 빈 날짜는 사진/메모 없는 `visit_days` 행으로 들어가고, 기존 동작과 동일하게 "여행 일수"에 자연스럽게 포함된다.

## 3. 자동 병합 (온보딩 첫 스캔 한정)

### 트리거 조건

`syncService.runSync`의 시작 시점에 다음을 평가한다:

```ts
const isFirstScan = (await db.getFirstAsync(
  `SELECT 1 FROM visit_days WHERE deleted_at IS NULL LIMIT 1`
)) == null;
```

- `isFirstScan === true`인 경우에만 자동 병합 실행
- 진짜 온보딩(visit_days가 비어있음) + 사용자가 데이터 초기화 후 재스캔하는 경우만 해당
- 평소 incremental sync는 항상 false → 자동 병합 안 함
- Settings의 "전체 재스캔"은 데이터가 이미 있으면 false → 사용자의 수동 분리/병합 결정을 클로버하지 않음

### 알고리즘

```
async function bridgeNearbyVisitDays(thresholdDays: number = 3): Promise<void> {
  // 1. 모든 visit_days를 country_code, date ASC로 fetch (deleted_at IS NULL)
  // 2. 각 country별 인접 두 날짜를 훑으며
  //    diffInDays(prev, cur)가 2 이상 thresholdDays 이하면
  //    그 사이의 빈 날짜에 ensureVisitDay 호출
  // 3. 단일 transaction
}
```

`thresholdDays = 3`의 의미: gap이 2/3일인 경우 채움. gap=2 → 사이가 1일 비어있음. gap=3 → 2일 비어있음. gap=4 이상은 채우지 않는다.

### 호출 위치

`syncService.runSync` 안에서 `addPhotos(...)` 직후, `refreshVisits()` 직전:

```ts
const added = await addPhotos(all);
if (isFirstScan) {
  await bridgeNearbyVisitDays(3);
}
await useVisitStore.getState().refreshVisits();
```

`isFirstScan`은 함수 진입 시 한 번만 평가하고 캐싱한다 (사진 추가 후 visit_days가 생기므로).

## 4. 수동 병합 화면 (CountryMergeScreen)

### 진입 파라미터

- `countryCode: string`

### 레이아웃

```
┌────────────────────────────┐
│ ‹    {국가} 여행 병합      │  ← 헤더
├────────────────────────────┤
│  병합할 여행을 선택하세요   │  ← 안내 텍스트
│                            │
│  ☐  03.20 — 03.22  3일·5장 │
│  ☐  03.16 — 03.18  3일·4장 │  ← gap 2일 (인접): 일반 여백
│  ┄┄┄ 12일 간격 ┄┄┄        │  ← 비인접: 추가 여백 + 점선 + 라벨
│  ☐  03.01 — 03.04  4일·2장 │
│  ☐  02.27 — 02.28  2일·3장 │  ← gap 2일 (인접)
│                            │
├────────────────────────────┤
│  N개 선택됨    [ 병합 ]    │  ← sticky 하단 액션 바
└────────────────────────────┘
```

### 데이터

- `loadTripsForCountry(countryCode)` → `RecentTrip[]` (시작일 DESC)
- 각 trip의 사진 수는 `countPhotosForTrip`으로 함께 계산
- 인접/비인접 판정: 위 trip의 endDate와 아래 trip의 startDate 간 `diffInDays`
  - `gap ≤ 3` → 인접
  - `gap > 3` → 비인접 (`GapDivider` 표시: 점선 + "N일 간격" 라벨 + 추가 상하 여백)

### 상호작용

1. 체크박스로 자유롭게 다중 선택 (인접/비인접 무관)
2. 2개 미만 선택 시 "병합" 버튼 비활성화
3. "병합" 탭 →
   - 선택한 trip들을 startDate 오름차순 정렬
   - 인접한 두 선택 trip 사이 gap이 모두 ≤ 3이면: 즉시 병합 실행
   - gap > 3인 경계가 하나라도 있으면: 확인 팝업 띄움
     - 제목: `merge.confirmGapTitle` ("정말 하나의 여행인가요?")
     - 본문: `merge.confirmGapBody` ("선택한 여행 사이에 최대 N일의 공백이 있어요. 정말 하나의 여행으로 합칠까요?")
     - 버튼: 취소 / 병합
4. 병합 실행: `mergeTrips(countryCode, min(startDate), max(endDate))` 호출
5. 완료 후: 화면에 그대로 남아있고 리스트만 리로드 + `visitStore.refreshVisits()` 호출. 사용자가 ‹로 직접 닫는다.

### 도메인 함수

```
async function mergeTrips(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<void> {
  // startDate ~ endDate 모든 날짜에 ensureVisitDay (단일 transaction)
}
```

`createTrip`과 본질적으로 같은 동작이지만, 도메인 의도(여러 여행을 하나로 합침)를 드러내기 위해 별도 export.

## 5. 진입 경로

### 5-1. CountryDetailScreen — 섹션 헤더 옆 버튼

기존 "여행" 섹션 헤더 우측에 텍스트 버튼 추가:

```
─────────────────────────────────
 여행            병합 ▸ | 최신순
─────────────────────────────────
```

- 표시 조건: `trips.length >= 2`일 때만 (병합할 게 있을 때만)
- 편집 모드(✎) 활성화 시에는 숨김 (UI 충돌 방지)
- 탭 시 `CountryMerge` 화면으로 navigate (`countryCode` 전달)

### 5-2. HistoryScreen — trip 행 하단 "병합하러 가기" 링크

각 trip 행의 본문 하단에 작은 보조 색상의 텍스트 링크:

```
┌──────────────────────────────────┐
│ 🇨🇳  중국 CN          2024·03·20 │
│      3일                       › │
│      ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│      동일한 여행인가요? 병합하러 가기 ▸│
└──────────────────────────────────┘
```

### 표시 조건

어떤 trip X에 대해, **같은 국가의 다른 trip Y가 존재하고 X와 Y 사이의 gap이 4~7일 이내**이면 X 행 하단에 링크 표시.

- gap 정의: 두 trip 중 더 이른 것의 endDate와 더 늦은 것의 startDate 사이의 `diffInDays`
- 자동 병합 임계값(3) 바로 위 + 1주 이내 = 4~7일
- 양쪽 모두 표시 (X와 Y 둘 다 같은 링크)
- 정렬 모드(recent/days/az)와 무관하게 동일 조건

### 메타 계산

`HistoryScreen`에서 `loadAllTrips()` 결과를 한 번 훑어서 trip별 boolean 플래그 `hasMergeHint`를 계산:

```
function computeMergeHints(trips: TripWithPhotos[]): Map<string, boolean> {
  // key = `${countryCode}|${startDate}|${endDate}`
  // 같은 국가끼리 그룹화
  // 각 그룹 내에서 모든 pair (i, j)에 대해
  //   gap = min(endDate i와 startDate j 간 diffInDays, ...)
  //   gap >= 4 && gap <= 7 인 게 있으면 두 trip 모두 true
}
```

`useMemo`로 trips가 바뀔 때만 재계산.

### 탭 동작

링크 영역 탭 시 `CountryMerge` 화면으로 navigate (`countryCode` 전달). 행 본문(trip 디테일 진입)과 탭 영역이 분리되도록 별도 `Pressable`로 감쌈.

## 6. Navigation

### 라우트 추가

`src/navigation/types.ts`:
```ts
CountryMerge: { countryCode: string };
```

`src/navigation/RootNavigator.tsx`에 라우트 등록.

`src/navigation/screens/CountryMergeScreenNav.tsx` 신규 — `useNavigation`/`useRoute` 어댑팅.

## 7. 파일 구조

### 신규

- `src/features/travel/visit/merge.ts`
  - `mergeTrips(countryCode, startDate, endDate)`
  - `bridgeNearbyVisitDays(thresholdDays)`
- `src/screens/CountryMergeScreen.tsx` — 화면 컨테이너
- `src/screens/CountryMergeScreen/TripCheckRow.tsx` — 체크박스 + trip 정보 행
- `src/screens/CountryMergeScreen/GapDivider.tsx` — 비인접 구분선
- `src/screens/CountryMergeScreen/styles.ts`
- `src/screens/CountryMergeScreen/utils.ts` — `gapBetween(prevEnd, curStart)`, `containsNonAdjacentGap(selected, threshold)`, `maxGap(selected)` 등
- `src/navigation/screens/CountryMergeScreenNav.tsx` — 네비 wrapper

### 수정

- `src/features/travel/visitRepository.ts` — `mergeTrips`, `bridgeNearbyVisitDays` re-export 추가
- `src/features/photoSync/syncService.ts` — `runSync`에 `isFirstScan` 가드 + `bridgeNearbyVisitDays(3)` 호출 추가
- `src/navigation/types.ts` — `CountryMerge: { countryCode: string }` 추가
- `src/navigation/RootNavigator.tsx` — 라우트 등록
- `src/screens/CountryDetailScreen.tsx` — 섹션 헤더 옆 "병합 ▸" 버튼 + navigate 핸들러
- `src/screens/CountryDetailScreen/styles.ts` — 병합 버튼 스타일
- `src/screens/HistoryScreen.tsx` — `computeMergeHints` 계산 + `TripRow`에 prop 전달 + 링크 탭 핸들러
- `src/screens/HistoryScreen/TripRow.tsx` — `showMergeHint`, `onMergeHintPress` prop + 하단 링크 영역
- `src/screens/HistoryScreen/styles.ts` — 링크 스타일
- `src/i18n/{locale}.json` — 신규 텍스트 키:
  - `merge.title` — "{country} 여행 병합"
  - `merge.subtitle` — "병합할 여행을 선택하세요"
  - `merge.gapLabel` — "{days}일 간격"
  - `merge.selectedCount` — "{count}개 선택됨"
  - `merge.actionMerge` — "병합"
  - `merge.confirmGapTitle` — "정말 하나의 여행인가요?"
  - `merge.confirmGapBody` — "선택한 여행 사이에 최대 {days}일의 공백이 있어요. 정말 하나의 여행으로 합칠까요?"
  - `countryDetail.mergeButton` — "병합 ▸"
  - `history.mergeHint` — "동일한 여행인가요? 병합하러 가기 ▸"

## 8. 동시성/안전성

- `bridgeNearbyVisitDays`, `mergeTrips`: 단일 `db.withTransactionAsync`. 부분 실패 시 자동 롤백.
- `ensureVisitDay`는 이미 `INSERT ... ON CONFLICT DO UPDATE` → 멱등.
- 자동 병합은 incremental sync 및 데이터 있는 상태의 full sync에서는 `isFirstScan` 가드로 절대 실행되지 않음.

## 9. 테스트

### 도메인 (Jest 단위 테스트)

- `bridgeNearbyVisitDays`
  - gap=2: 사이 1일 채워짐
  - gap=3: 사이 2일 채워짐
  - gap=4: 채우지 않음
  - 다른 국가는 절대 합치지 않음
  - soft-deleted visit_days는 무시
- `mergeTrips`
  - startDate~endDate 사이의 모든 날짜가 visit_days에 들어있음
  - 기존 visit_days를 덮어쓰지 않음 (멱등)

### 유틸 (Jest)

- `gapBetween`, `containsNonAdjacentGap`, `maxGap` — 경계값 (gap=3, gap=4) 케이스

### 화면 (수동/추후)

- 첫 스캔 시 한 달살이 시뮬레이션 데이터로 자동 병합 동작 확인
- 병합 화면 다중 선택 → 병합 → 리스트 갱신
- 비인접 선택 시 확인 팝업 동작
- HistoryScreen의 "병합하러 가기" 링크 표시 조건 (gap=3, 4, 7, 8 케이스)

## 10. Out of Scope (이번 변경에서 다루지 않음)

- 여행 분리 (split) 기능
- 자동 병합의 임계값 사용자 설정
- 병합 취소(undo)
- 병합 화면에서 인접 trip 자동 그룹 미리보기
