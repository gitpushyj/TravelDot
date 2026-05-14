# 비행 타이머 라이브액티비티 설계

작성일: 2026-05-14

## 배경

비행모드 타이머(`src/features/flight/`)는 사용자가 출발/도착 공항과 시각을 정하면
앱 안에서 진행률 애니메이션과 남은 시간을 보여준다. 이 타이머를 iOS 라이브액티비티
(잠금화면 + Dynamic Island)로도 노출해, 앱을 열지 않고도 비행 진행 상황을 볼 수 있게 한다.

라이브액티비티 UI는 출발지·도착지 공항명을 일자선으로 잇고, 그 위를 비행기가
타이머처럼 이동하며, 남은 시간을 함께 표기한다.

## 범위 결정

- **iOS 전용.** 라이브액티비티는 ActivityKit 기반 iOS 16.1+ 기능이다. 안드로이드는
  이번 작업 범위에 포함하지 않으며 기존 인앱 타이머를 그대로 둔다.
- **네이티브 통합 방식:** `@bacons/apple-targets` 플러그인으로 SwiftUI 위젯 타깃을
  직접 작성하고, JS↔ActivityKit 브리지는 작은 로컬 Expo 모듈로 구현한다.

## 아키텍처

네 개의 독립 단위로 구성한다.

### 1. Widget Extension 타깃 — `targets/flight-activity/`

`@bacons/apple-targets`가 prebuild 시 Xcode 위젯 익스텐션 타깃으로 생성한다.
SwiftUI로 라이브액티비티 UI를 작성한다.

- `expo-target.config.js` — 타깃 정의(타입: widget, 디스플레이 네임 등)
- `FlightActivityAttributes.swift` — `ActivityAttributes` 구조체.
  정적 데이터: 출발/도착 공항명·IATA 코드, `departAt`(ms epoch), `arriveAt`(ms epoch).
  `ContentState`는 비워 둔다(타이머가 시간 구동이라 런타임 갱신 불필요).
- `FlightActivityWidget.swift` — `Widget` 진입점, `ActivityConfiguration`
- `LockScreenView.swift` — 잠금화면 카드 뷰
- `DynamicIslandView.swift` — Dynamic Island compact/minimal/expanded 뷰
- `RouteLineView.swift` — 출발지→도착지 일자선 + 비행기 컴포넌트 (잠금화면과
  expanded가 공유)

`FlightActivityAttributes.swift`는 위젯 타깃과 로컬 모듈 양쪽의 컴파일 소스에
포함되어 같은 타입을 공유한다.

### 2. 로컬 Expo 모듈 — `modules/flight-live-activity/`

JS에서 ActivityKit을 호출하기 위한 얇은 네이티브 모듈.

- `expo-module.config.json`
- `ios/FlightLiveActivityModule.swift` — Swift 모듈. 노출 API:
  - `start(attrs)` → `Activity<FlightActivityAttributes>.request(...)` 호출
  - `end()` → 진행 중인 모든 `FlightActivityAttributes` 액티비티 종료
  - `reconcile(attrs?)` → 현재 액티비티 목록을 검사해 정확히 의도한 상태로 맞춤
    (진행 중 비행이 있으면 1개만 유지, 없으면 전부 종료)
  - `isSupported()` → `ActivityAuthorizationInfo().areActivitiesEnabled` 등 가용성
- `index.ts` — 네이티브 모듈의 TS 타입 정의

### 3. JS 래퍼 — `src/features/flight/liveActivity.ts`

플랫폼 가드와 타입 안전 API를 제공하는 얇은 래퍼.

- iOS가 아니거나 미지원이면 모든 함수가 graceful no-op
- `flightStore`가 다루는 `ActiveFlight`를 모듈이 기대하는 attributes 형태로 변환
- 라이브액티비티 사용 권한이 꺼져 있으면 조용히 무시(에러 throw 안 함)

### 4. store 연결 — `src/features/flight/flightStore.ts` 수정

- `start()` → 기존 로직 + `liveActivity.start(...)`
- `cancel()` → 기존 로직 + `liveActivity.end()`
- `checkArrival()` 도착 처리 시 → `liveActivity.end()`
- `hydrate()`:
  - 앱이 꺼진 동안 도착한 경우 → `liveActivity.end()`
  - 진행 중 비행이 남아 있는 경우 → `liveActivity.reconcile(...)`로 액티비티 1개만 유지

## 데이터 흐름

핵심: **푸시 알림도, 백그라운드 실행도, 서버도 필요 없다.**

비행 타이머는 종료 시각(`arriveAt`)이 시작 시점에 이미 확정된다. iOS는 고정된 시간
범위로부터 `Text(timerInterval:)`과 `ProgressView(timerInterval:)`를 자동으로
갱신하므로, 앱이 한 번 액티비티를 등록한 뒤에는 어떤 런타임 업데이트도 보내지 않는다.

```
flightStore.start(origin, dest, departAt, arriveAt)
  → liveActivity.start({ originName, originIata, destName, destIata, departAt, arriveAt })
  → FlightLiveActivityModule.start(...)
  → Activity<FlightActivityAttributes>.request(...)
  → iOS가 잠금화면/Dynamic Island에 위젯 렌더, timerInterval 뷰를 자체 갱신

flightStore.cancel() / checkArrival() 도착 / hydrate() 백그라운드 도착
  → liveActivity.end()
  → FlightLiveActivityModule.end()
  → 진행 중인 FlightActivityAttributes 액티비티 전부 종료
```

## UI

### 잠금화면 카드

```
출발지 공항명                          도착지 공항명
●━━━━━━━━━✈┄┄┄┄┄┄┄┄┄┄┄┄┄┄○
                남은 시간  1:23:45
```

- 상단 행: 좌측에 출발지 공항명, 우측에 도착지 공항명
- 중앙: 출발지(●)와 도착지(○)를 잇는 일자선. 지나온 구간은 실선, 남은 구간은
  점선, 두 구간의 경계에 비행기 글리프
- 하단: `Text(timerInterval:)`로 남은 시간 카운트다운, 중앙 정렬

### Dynamic Island

- **compact leading:** 비행기 아이콘
- **compact trailing:** 남은 시간 (`Text(timerInterval:)`)
- **minimal:** 비행기 아이콘
- **expanded:** 잠금화면 카드와 동일한 구성(출발/도착명 + 경로선 + 비행기 + 남은 시간)

## 비행기 이동에 대한 기술적 제약

라이브액티비티는 커스텀 애니메이션 루프를 돌릴 수 없다. 푸시 없이 자동 갱신되는
SwiftUI 뷰는 `Text(timerInterval:)`과 `ProgressView(timerInterval:)` 둘뿐이다.

따라서 경로선은 `ProgressView(timerInterval:)`에 커스텀 `ProgressViewStyle`을 입혀
구현하고, 비행기는 채워지는 fill의 선두에 배치한다.

**불확실성:** iOS의 `timerInterval` 변형에서 커스텀 `ProgressViewStyle`이 진행률
(`fractionCompleted`)을 노출하는지가 OS 버전에 따라 확실하지 않다. 이 때문에 구현의
**첫 번째 작업을 짧은 스파이크**로 두어 실제 동작을 확인한다.

- 스파이크 성공: 비행기가 fill 선두를 따라 연속 이동
- 스파이크 실패 시 폴백: 비행기는 도착지 끝에 고정하고, 실선 fill이 비행기를 향해
  차오르며 진행을 표현. 일자선 양 끝의 공항명·점/원 표기는 동일하게 유지

어느 쪽이든 푸시·서버·백그라운드 실행은 0이며, 남은 시간 카운트다운은 항상 동작한다.

## 빌드·설정

- `app.json` `plugins`에 `@bacons/apple-targets` 추가
- 메인 앱 Info.plist에 `NSSupportsLiveActivities: true` (config plugin이 처리)
- 위젯 타깃과 메인 앱(또는 로컬 모듈)에 App Group entitlement 부여 — 같은
  `ActivityAttributes` 타입과 액티비티를 공유하기 위함
- **dev build 필요.** Expo Go에서는 테스트 불가. 로컬 prebuild + Xcode 또는 EAS
  dev build로 검증한다.

## 엣지케이스

- **사용자가 라이브액티비티를 끈 경우:** `liveActivity.start()`가 graceful no-op,
  에러를 throw하지 않는다.
- **앱이 꺼진 동안 비행 종료:** 라이브액티비티는 시간 구동이라 앱 없이도 도착
  시점에 적절히 표시된다. `hydrate()`에서 도착을 감지하면 `end()`로 명시적으로 정리.
- **중복 액티비티:** `hydrate()` 시 `reconcile()`이 `Activity.activities`를 열거해
  진행 중 비행에 대해 정확히 1개만 남기고 나머지를 종료한다.
- **iOS 외 플랫폼:** JS 래퍼에서 전부 no-op.

## i18n

위젯 내부 정적 텍스트는 최소화한다. 잠금화면은 대부분 공항명(데이터) + 순수
타이머로 구성되므로 정적 라벨이 거의 없다. 필요한 라벨(예: "남은 시간")이 생기면
JS에서 이미 번역된 문자열을 attributes에 담아 위젯에 전달해 기존 i18n을 재사용한다.

새 i18n 키가 필요하면 `flight.liveActivity.*` 네임스페이스로 `src/i18n/locales/`의
**10개 언어 전부**(de, en, es, fr, it, ja, ko, ru, zh-CN, zh-TW)에 동시에 추가한다.

## 파일 구조

신규:
- `targets/flight-activity/expo-target.config.js`
- `targets/flight-activity/FlightActivityAttributes.swift`
- `targets/flight-activity/FlightActivityWidget.swift`
- `targets/flight-activity/LockScreenView.swift`
- `targets/flight-activity/DynamicIslandView.swift`
- `targets/flight-activity/RouteLineView.swift`
- `modules/flight-live-activity/expo-module.config.json`
- `modules/flight-live-activity/index.ts`
- `modules/flight-live-activity/ios/FlightLiveActivityModule.swift`
- `src/features/flight/liveActivity.ts`

수정:
- `app.json` — `@bacons/apple-targets` 플러그인 추가
- `src/features/flight/flightStore.ts` — start/cancel/checkArrival/hydrate에 연결
- `package.json` — `@bacons/apple-targets` 의존성

## 검증

Expo Go로는 검증 불가. dev client를 빌드한 뒤:

1. 짧은 비행(약 2분)을 시작 → 잠금화면 카드와 Dynamic Island에 위젯이 나타나는지
2. 남은 시간 카운트다운이 자동으로 줄어드는지
3. 비행기/실선 fill이 진행에 따라 이동·증가하는지
4. 도착 시각 도달 시 액티비티가 종료되는지
5. 비행 취소 시 액티비티가 즉시 종료되는지
6. 앱을 죽인 뒤 다시 열었을 때(`hydrate`) 액티비티가 중복되지 않고 1개만 유지되는지
