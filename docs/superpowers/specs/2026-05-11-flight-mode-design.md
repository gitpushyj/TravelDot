# Flight Mode (비행모드) — 디자인 스펙

작성일: 2026-05-11
상태: 설계 (구현 전)

## 1. 개요

도트지도 위에 사용자가 탑승한 비행기의 실시간 진행 상황을 픽셀 비행기 애니메이션으로 시각화하는 기능. 비행 중 엔터테인먼트(시간 보내기) 용도이며, 여행 기록(trip)을 자동으로 남기지는 않는다.

### 핵심 시나리오

1. 사용자가 비행기에 탑승해 좌석에 앉음
2. VisitGrid 메인 화면 → MapActions의 ✈️ 버튼 탭
3. 출발/도착 공항, 출발 시각 입력 → 도착 시각은 평균 비행시간으로 자동 계산(수정 가능)
4. "비행 시작" 누름 → 도트지도가 비행 경로 전체가 보이도록 줌, 비행기 픽셀이 출발지에서 도착지로 천천히 이동
5. 도착시각 도달 → 도착 펄스 + 토스트 → 자동 클리어

## 2. 진입점 & 입력 흐름

### 2.1 진입점

`src/screens/MainScreen/MapActions.tsx`의 버튼 행 맨 왼쪽에 비행 버튼 추가.

```
[ ✈️ 비행 ]   [ 📤 공유 ]   [ 🔍 줌 ]
```

비행 진행 중에는 같은 자리의 버튼이 라이브 상태로 바뀐다. 일반 아이콘 버튼은 정사각형 크기지만, 라이브 상태에서는 폭이 자연스럽게 늘어나는 chip 형태로 변경:

```
[ ✈️ ICN → NRT · 4h 12m 남음 ]
```

이때 옆에 있는 [공유][줌] 버튼은 라이브 chip이 차지하는 폭만큼 오른쪽으로 밀린다. 라이브 chip 안의 텍스트는 매 분마다 (또는 도착 시점이 가까우면 더 자주) 갱신.

탭 → 비행 디테일 시트 열림.

### 2.2 입력 모달

✈️ 버튼 → 한 화면 폼 모달.

```
┌─────────────────────────────────┐
│  비행 시작                     ✕  │
├─────────────────────────────────┤
│  출발                           │
│  [ ICN  ·  인천국제공항      ]  │ ← 탭하면 검색 시트
│                                 │
│  도착                           │
│  [ NRT  ·  나리타국제공항    ]  │
│                                 │
│  출발 시각                       │
│  [ 지금 (2026-05-11 14:32)   ]  │ ← 시간 피커
│                                 │
│  도착 시각                       │
│  [ 17:02  (2h 30m 비행)       ]  │ ← 자동 계산, 수정 가능
│  ↳ 평균 비행시간으로 자동 계산   │
│                                 │
│         [ 비행 시작 ]            │
└─────────────────────────────────┘
```

규칙:
- 네 필드 모두 채워져야 "비행 시작" 활성화
- 도착 시각 < 출발 시각 → 검증 에러 표시
- 출발 시각 기본값은 "지금"(현재 폰 시각). 자유 수정 가능(과거/미래)

### 2.3 공항 검색

탭 → 풀스크린 검색 시트.

- 입력 필드 + 라이브 결과 list
- IATA 코드 / 도시명 / 공항명 / 국가명으로 매칭 (대소문자 무시, 부분 일치)
- 예:
  - `seoul` → ICN(인천), GMP(김포)
  - `nrt` → NRT(나리타)
  - `도쿄` → NRT, HND
- 결과는 `IATA · 공항명 · 도시, 국가` 형태로 한 줄 표시
- 검색어 비어 있을 때는 안내 문구만 (즐겨찾기/최근 사용은 v2)

### 2.4 평균 비행시간 자동 계산

두 공항이 모두 선택되면 도착 시각 자동 입력:

1. 대권거리(great-circle distance) 계산: `haversine(lat1, lng1, lat2, lng2)` → km
2. 평균 순항속도 = 800 km/h
3. 이착륙·택싱 보정 = +30분
4. `estimatedMinutes = (distanceKm / 800) * 60 + 30`
5. 도착 시각 = 출발 시각 + estimatedMinutes

사용자가 도착 시각을 수동 수정하면 그 값이 우선. 이후 출발지/도착지를 다시 바꾸면 자동 계산 값으로 복귀(사용자 수정 플래그 리셋).

## 3. 비행 중 시각화

### 3.1 비행기 픽셀아트

11 × 10 그리드, 약 50개 픽셀 사용. 위에서 본 여객기 실루엣.

```
. . . . . ● . . . . .     ← 코
. . . . ● ● ● . . . .
. . . . ● ● ● . . . .     ← 동체 앞
● ● ● ● ● ● ● ● ● ● ●     ← 주날개 (전폭)
● ● ● ● ● ● ● ● ● ● ●
. . . . ● ● ● . . . .
. . . . ● ● ● . . . .     ← 동체 뒤
. . . . ● ● ● . . . .
. . . ● ● ● ● ● ● ● . .    ← 수평 꼬리날개
. . . . ● ● ● . . . .     ← 꼬리
```

- 비행기 픽셀 1개 ≈ 도트지도 도트의 약 1/3~1/4 크기 (전체 비행기 ≈ 도트 3 × 2.5개 분)
- 도트지도 transform 그룹 안에 렌더 → 줌인/팬에 같이 따라감
- 색상: **흰색 본체 + 1px 어두운 outline**. 본국 색·방문국 색·미방문 회색 모두와 충분히 대비되어 다크/라이트 테마 양쪽에서 일관되게 식별 가능.
- 진행 방향에 따라 통째로 회전 (bearing 기반)

### 3.2 비행기 위치 계산 (대권 slerp)

매 프레임마다:

1. `progress = clamp((now - departAt) / (arriveAt - departAt), 0, 1)`
2. 출발/도착 좌표를 단위 벡터로 변환: `lat/lng → (x, y, z)` (구면 단위벡터)
3. 두 벡터의 spherical linear interpolation (slerp):
   ```
   omega = acos(dot(v1, v2))
   v(t) = (sin((1-t) * omega) / sin(omega)) * v1 + (sin(t * omega) / sin(omega)) * v2
   ```
4. 단위벡터를 다시 `(lat, lng)`로 변환
5. equirectangular 도트지도 좌표로 변환: `x = (lng + 180) * baseScale`, `y = (maxLat - lat) * baseScale`

worklet 안에서 실행 (Reanimated `useDerivedValue`). 매 프레임 JS bridge 없이 GPU 스레드에서 합성.

### 3.3 회전 (bearing)

비행기 코가 현재 진행 방향을 향하도록.

```
bearing = atan2(
  sin(Δlng) * cos(lat2),
  cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(Δlng)
)
```

비행 시작 시 한 번 계산 후 고정해도 충분(대권에서 bearing은 천천히 변하지만 시각적 차이 작음). 단순화를 위해 비행 시작 시 출발→도착 initial bearing으로 고정.

### 3.4 비행 경로 (점선)

- 출발→도착 대권 경로를 ~50개 점으로 샘플링
- 각 점은 도트지도 도트와 같은 크기의 작은 사각형
- 지나온 점(progress 미만): 진한 강조색
- 남은 점: 흐린 강조색 (alpha 0.3 정도)
- 매 프레임 progress 따라 색이 자연스럽게 흘러감 (worklet에서 `i < progress * N`)

### 3.5 시작 시 viewport 줌

비행 시작 직후, **출발지에 줌인된 상태에서 시작 → 1.5초에 걸쳐 부드럽게 줌아웃**해 출발+도착지가 모두 보이는 viewport로 이동.

- **시작 viewport**: 출발 공항 좌표가 화면 중앙, 비행기 픽셀이 충분히 또렷이 보이는 줌 (대략 도트가 viewport 폭의 ~12% 정도 차지하는 배율; 출발 도시 한두 개가 보이는 정도). 모달 닫히는 순간 viewport는 인트로가 끝낸 기본 위치에서 **이 시작 viewport로 한 번 cut(즉시) 이동**한 뒤 동시에 비행기가 등장.
- **종료 viewport**: 출발지 + 도착지 bounding box + padding 1.4를 모두 담는 fit-zoom.
- **타이밍**: 시작 viewport → 종료 viewport `withTiming({ duration: 1500, easing: cubic in-out })`. 비행기의 진행률 보간은 viewport 줌아웃과 **동시에** 0에서 시작.

기존 인트로 줌아웃 애니메이션(`playIntro`)과의 충돌은 없음 — 인트로는 MainScreen 첫 진입 시 한 번만 재생되고, 비행 시작은 사용자가 모달에서 OK를 누른 시점이라 시간상 항상 인트로 완료 이후이기 때문. 비행 시작 줌은 cancelAnimation으로 인트로 잔여 큐를 먼저 정리한 뒤 시작 viewport로 즉시 점프, 그 다음 withTiming으로 줌아웃.

### 3.6 인터랙션

비행 중에도 도트지도 줌/팬은 그대로 동작. 사용자가 자유롭게 확대/축소하며 볼 수 있음. 비행기·경로는 transform에 묶여 있어 자연스럽게 따라감.

## 4. 비행 중 디테일 시트

✈️ 라이브 버튼 탭 → 하단 시트.

```
┌─────────────────────────────────┐
│  비행 중                       ✕  │
├─────────────────────────────────┤
│  ICN  인천국제공항               │
│  ↓                              │
│  NRT  나리타국제공항             │
│                                 │
│  출발  14:32  (2026-05-11)      │
│  도착  17:02  (2026-05-11)      │
│                                 │
│  ████████████░░░░░░░  62%       │
│  남은 시간 · 56분                │
│                                 │
│       [ 비행 종료 ]              │
└─────────────────────────────────┘
```

"비행 종료" → 확인 다이얼로그 → 상태 클리어. 도트지도의 비행기·경로 사라짐.

## 5. 도착 처리

도착 시각 도달 시:

1. 비행기를 도착 공항 좌표에 정확히 안착
2. 도착 공항 위치에 작은 원이 퍼지는 펄스 애니메이션 (1.5초)
3. 인앱 토스트: `도착했어요 · NRT 나리타`
4. 5초 후 또는 ✈️ 버튼 탭 → 상태 자동 클리어, MapActions 원래대로

앱이 백그라운드 상태에서 도착 시각이 지나간 경우: 다음 메인 화면 진입 시 즉시 토스트 표시 + 상태 클리어. 푸시 알림은 v2.

## 6. 데이터 모델

### 6.1 공항 데이터 (정적)

출처: OurAirports (public domain) 또는 동등한 공개 데이터셋의 large_airport + medium_airport 서브셋.

```
src/assets/data/airports.json
```

```ts
type AirportData = {
  iata: string;       // "ICN"
  name: string;       // "Incheon International Airport"
  nameLocal?: string; // "인천국제공항" (한국어 등 추후)
  city: string;       // "Seoul"
  cityLocal?: string;
  country: string;    // ISO-3166-1 alpha-2, e.g. "KR"
  lat: number;        // 37.4691
  lng: number;        // 126.4505
};
```

규모: 약 3,000개 (medium+large 기준). JSON gzipped ~100KB. 앱 번들 부담 미미.

### 6.2 비행 상태 (Zustand + persist)

```ts
// src/features/flight/flightStore.ts
type AirportRef = {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
};

type ActiveFlight = {
  id: string;             // uuid
  origin: AirportRef;
  destination: AirportRef;
  departAt: number;       // ms epoch (폰 로컬 기준)
  arriveAt: number;       // ms epoch
};

type FlightState = {
  active: ActiveFlight | null;
  start: (origin, destination, departAt, arriveAt) => void;
  cancel: () => void;
};
```

AsyncStorage로 persist. 앱 재시작 후 `active`가 있으면:
- `now < arriveAt` → 비행 계속 (진행률 다시 계산)
- `now >= arriveAt` → 도착 toast + 클리어

## 7. 파일 구조

```
src/features/flight/
  flightStore.ts                // Zustand store + AsyncStorage persist
  airports.ts                   // 공항 데이터 로딩 + 검색
  flightMath.ts                 // haversine, slerp, bearing, equirectangular 변환
  estimateFlightDuration.ts     // 평균 비행시간 계산
  FlightButton.tsx              // MapActions 안에 들어가는 ✈️ 버튼 (idle/live 상태)
  FlightInputModal.tsx          // 입력 폼
  AirportPicker.tsx             // 공항 검색 시트
  FlightDetailSheet.tsx         // 진행 중 디테일 + 종료
  useFlightProgress.ts          // 진행률 worklet 훅
  ArrivalToast.tsx              // 도착 인앱 토스트
  airplanePixels.ts             // 11×10 비행기 픽셀 정의

src/components/DotMap/
  FlightOverlay.tsx             // 비행기 + 경로 점선 (Skia Group)

src/assets/data/
  airports.json                 // OurAirports 서브셋

src/screens/MainScreen/
  MapActions.tsx                // ✈️ 버튼 자리 추가 (수정)

src/components/DotMap.tsx        // FlightOverlay 통합 (수정)
```

DotMap.tsx는 `useFlightStore`를 구독해 active 비행이 있으면 같은 transform 그룹에 `<FlightOverlay />` 렌더링. 줌/팬 자연 연동.

## 8. 평균 비행시간 계산 정확도

대권거리 + 평균 순항속도 + 이착륙 보정 모델은 실제 운항시간과 평균 ±15분 이내로 일치한다 (단거리에서 오차가 비율적으로 크지만 절대치는 작음). 사용자가 도착 시각을 수동 수정할 수 있으므로 정확한 운항 데이터 테이블은 불필요.

## 9. 다른 화면과의 관계

### 9.1 MainScreen (메인 홈)
비행기·경로·시작 줌·디테일 시트의 풀 시각화가 동작하는 주 화면.

### 9.2 MapZoomScreen (지도 전체화면)
공유 버튼 우측의 줌(🔍) 버튼으로 들어가는 90° 회전된 가로 전체화면 지도. 비행 중에는 동일한 비행기·경로 오버레이가 함께 표시된다.

- DotMap 인스턴스가 별개로 마운트되지만, `useFlightStore`를 같이 구독하므로 같은 비행 상태를 본다.
- 비행기 위치 계산 로직과 경로 점선은 MainScreen과 동일한 `<FlightOverlay />` 컴포넌트 재사용. `parentRotated90` prop이 들어와 있어 좌표는 자동으로 회전된 frame에 맞게 들어간다 (DotMap.tsx의 기존 회전 처리에 포함).
- 시작 시 줌 애니메이션(3.5절)은 MainScreen 진입점 한정. MapZoomScreen은 진입 시 자체적으로 적절한 viewport(전체 세계지도 또는 비행 경로 fit)를 잡으며 시작 줌 시퀀스는 재생하지 않는다.
- **남은 시간 오버레이**: 화면 중앙 하단에 반투명 pill로 다음을 표시.
  ```
  ┌──────────────────────────────┐
  │  ✈️  ICN → NRT · 4h 12m 남음 │
  └──────────────────────────────┘
  ```
  - 배경: `rgba(0, 0, 0, 0.55)` 정도의 반투명 다크 (라이트/다크 테마 양쪽에서 흰 텍스트 가독)
  - 위치: 회전 컨테이너의 bottomOverlay 자리(기존 국가명 토스트와 같은 위치). 두 오버레이가 동시에 뜨는 경우 비행 정보를 우선 표시 (국가명 토스트는 그 위로 짧게 겹쳐 표시).
  - 도착 직후의 토스트 ("도착했어요 · NRT 나리타")도 같은 자리에서 표시되어 자연스럽게 전환.
- pointerEvents: "none" — 사용자의 줌/팬을 가리지 않음.

### 9.3 그 외 화면
설정/AI/히스토리/CountryDetail 등에서는 비행 시각화 표시 없음. `useFlightStore`는 전역이라 어디서든 진행 상태를 알 수 있어 추후 화면별 인디케이터 추가는 가능(v2 확장 여지).

## 10. 범위 제외 (YAGNI)

다음은 명시적으로 v1에서 다루지 않는다:

- **푸시 알림** — `expo-notifications` 권한 추가가 부담. 인앱 토스트로 v1 충분.
- **시간대 자동 변환** — "현지 시각으로 14:00 출발 → 도착지 16:30" 같은 멀티 타임존 표시는 v2. 폰 로컬 시각만 사용.
- **다중 동시 비행** — 1개만 허용. 진행 중 ✈️ 버튼은 디테일 시트로 열리고 새 비행 시작 불가(종료 후 가능).
- **즐겨찾기/최근 공항** — 사용 데이터 쌓인 후 v2.
- **현재 위치 자동 출발지** — `expo-location` 권한 추가 비용 vs 가치 미정. v2.
- **Trip 자동 기록** — A 모드의 본질이 "기록 아닌 시각화"이므로 명시적으로 제외. B/C 모드 검토 시 별도 스펙.
- **항공편명(Flight number) 검색 연동** — 외부 API 의존도 큼. v2.

## 11. 성능 고려

- DotMap은 이미 Skia + Reanimated 기반으로 수백 개 도트를 60fps로 처리 중. 비행기 1개 + 경로 점 ~50개 추가는 부담 미미.
- 진행률 보간은 worklet(`useDerivedValue` 또는 `useFrameCallback`)에서 GPU 스레드로 처리. JS bridge 부담 0.
- 백그라운드/포어그라운드 전환 시 진행률은 시각 차이로만 다시 계산되므로 백그라운드 timer 불필요.

## 12. 테스트 전략

단위 테스트 (Jest):

- `flightMath.ts` — haversine 거리, slerp 중간값, bearing 계산. 잘 알려진 좌표쌍(인천-나리타, JFK-LAX 등)으로 검증.
- `estimateFlightDuration.ts` — 거리별 예상 시간 (단거리 / 중거리 / 장거리)
- `airports.ts` — 검색 매칭 로직(코드/도시/이름/대소문자)
- `flightStore.ts` — start/cancel/auto-clear-on-arrival 동작

수동 테스트:
- 입력 → 비행 시작 → 진행률 보임 확인
- 백그라운드 갔다 복귀 → 진행률 유지 확인
- 앱 재시작 → 비행 상태 복원 확인
- 도착시각 도달 → toast + 자동 클리어 확인
- 종료 버튼 → 즉시 클리어 확인
