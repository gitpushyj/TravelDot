# 비행 타이머 라이브액티비티 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비행모드 타이머를 iOS 라이브액티비티(잠금화면 + Dynamic Island)로 노출해, 출발지→도착지 일자선 위를 비행기가 이동하며 남은 시간을 보여준다.

**Architecture:** `@bacons/apple-targets`로 SwiftUI 위젯 익스텐션 타깃을 작성하고, JS↔ActivityKit 브리지는 로컬 Expo 모듈로 구현한다. 타이머는 종료 시각이 확정되어 있으므로 iOS의 `Text(timerInterval:)`·`ProgressView(timerInterval:)` 자동 갱신만 사용하고 푸시·백그라운드 실행·서버는 없다. `flightStore`의 start/cancel/checkArrival/hydrate에서 액티비티를 시작·종료한다.

**Tech Stack:** Expo SDK 54, `@bacons/apple-targets`, ActivityKit, WidgetKit, SwiftUI, expo-modules-core, Zustand, Jest.

> **설계 대비 변경점:** 스펙의 `reconcile()`은 별도 함수 대신 **멱등 `start()`**로 대체한다. `start()`가 호출될 때 항상 기존 액티비티를 먼저 종료하고 새로 1개만 생성하므로, `hydrate()`에서 진행 중 비행에 대해 `start()`를 다시 호출하면 중복 없이 1개만 유지된다. 별도 reconcile 로직 불필요.
>
> **i18n:** 위젯은 공항명(데이터) + 순수 타이머 텍스트만 표시하고 정적 번역 라벨이 없다. 따라서 이번 작업에 새 i18n 키는 필요 없다.

---

## File Structure

신규:
- `targets/flight-activity/expo-target.config.js` — @bacons/apple-targets 위젯 타깃 정의
- `targets/flight-activity/FlightActivityAttributes.swift` — `ActivityAttributes` 구조체 (위젯 타깃과 로컬 모듈이 공유)
- `targets/flight-activity/FlightActivityWidget.swift` — `@main` 위젯 번들 + `ActivityConfiguration`
- `targets/flight-activity/LockScreenView.swift` — 잠금화면 카드 뷰
- `targets/flight-activity/DynamicIslandView.swift` — Dynamic Island expanded 영역 뷰
- `targets/flight-activity/RouteLineView.swift` — 출발지→도착지 일자선 + 비행기 (잠금화면·expanded 공유)
- `modules/flight-live-activity/package.json` — 로컬 모듈 패키지 메타
- `modules/flight-live-activity/expo-module.config.json` — Expo 모듈 설정
- `modules/flight-live-activity/ios/FlightLiveActivity.podspec` — CocoaPods 스펙 (공유 swift 파일 참조 포함)
- `modules/flight-live-activity/ios/FlightLiveActivityModule.swift` — JS↔ActivityKit 브리지
- `modules/flight-live-activity/index.ts` — 네이티브 모듈 TS 타입
- `src/features/flight/liveActivity.ts` — 플랫폼 가드 JS 래퍼
- `src/features/flight/__tests__/liveActivity.test.ts` — 래퍼 jest 테스트
- `src/features/flight/__tests__/flightStore.liveActivity.test.ts` — store 연결 jest 테스트

수정:
- `app.json` — `@bacons/apple-targets` 플러그인 + `ios.infoPlist.NSSupportsLiveActivities`
- `package.json` — `@bacons/apple-targets` devDependency
- `src/features/flight/flightStore.ts` — start/cancel/checkArrival/hydrate에 라이브액티비티 연결

---

## Task 1: @bacons/apple-targets 설치 + 최소 위젯 타깃 스캐폴드

위젯 익스텐션 타깃이 prebuild로 생성되고 dev build에서 인식되는 네이티브 파이프라인을 먼저 세운다. 이 시점의 위젯은 "Hello" 플레이스홀더만 렌더한다.

**Files:**
- Modify: `package.json`
- Modify: `app.json`
- Create: `targets/flight-activity/expo-target.config.js`
- Create: `targets/flight-activity/FlightActivityWidget.swift` (이 태스크에서는 플레이스홀더 버전)

- [ ] **Step 1: `@bacons/apple-targets` 설치**

```bash
npx expo install @bacons/apple-targets
```

Expected: `package.json`의 `devDependencies` 또는 `dependencies`에 `@bacons/apple-targets`가 추가된다.

- [ ] **Step 2: `app.json`에 플러그인과 Info.plist 키 추가**

`app.json`의 `expo.plugins` 배열 끝에 `"@bacons/apple-targets"`를 추가하고, `expo.ios`에 `infoPlist`를 추가한다.

`expo.ios` 객체 (기존 키 유지, `infoPlist` 추가):
```json
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.gitpush.visitgrid",
      "buildNumber": "2",
      "appleTeamId": "27LS459HJ3",
      "usesAppleSignIn": true,
      "googleServicesFile": "./GoogleService-Info.plist",
      "config": {
        "usesNonExemptEncryption": false
      },
      "infoPlist": {
        "NSSupportsLiveActivities": true
      }
    },
```

`expo.plugins` 배열의 마지막 항목(`expo-tracking-transparency` 블록) 다음에 추가:
```json
      "@bacons/apple-targets"
```

- [ ] **Step 3: 위젯 타깃 정의 파일 작성**

Create `targets/flight-activity/expo-target.config.js`:
```js
/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "widget",
  name: "FlightActivity",
  deploymentTarget: "16.2",
  frameworks: ["SwiftUI", "WidgetKit", "ActivityKit"],
};
```

- [ ] **Step 4: 플레이스홀더 위젯 작성**

Create `targets/flight-activity/FlightActivityWidget.swift`:
```swift
import WidgetKit
import SwiftUI

@main
struct FlightActivityBundle: WidgetBundle {
  var body: some Widget {
    FlightActivityPlaceholder()
  }
}

struct FlightActivityPlaceholder: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "FlightActivityPlaceholder", provider: PlaceholderProvider()) { _ in
      Text("Flight Activity")
    }
  }
}

struct PlaceholderEntry: TimelineEntry {
  let date: Date
}

struct PlaceholderProvider: TimelineProvider {
  func placeholder(in context: Context) -> PlaceholderEntry { PlaceholderEntry(date: Date()) }
  func getSnapshot(in context: Context, completion: @escaping (PlaceholderEntry) -> Void) {
    completion(PlaceholderEntry(date: Date()))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<PlaceholderEntry>) -> Void) {
    completion(Timeline(entries: [PlaceholderEntry(date: Date())], policy: .never))
  }
}
```

- [ ] **Step 5: prebuild로 타깃 생성 확인**

Run: `npx expo prebuild -p ios --clean`
Expected: 에러 없이 완료되고, `ios/` 디렉터리와 함께 Xcode 프로젝트에 `FlightActivity` 위젯 익스텐션 타깃이 생성된다. 다음으로 확인:

Run: `grep -r "FlightActivity" ios/*.xcodeproj/project.pbxproj | head`
Expected: `FlightActivity` 관련 타깃/빌드 설정 라인이 출력된다.

- [ ] **Step 6: 커밋**

```bash
git add package.json app.json targets/flight-activity/
git commit -m "chore(live-activity): @bacons/apple-targets 위젯 타깃 스캐폴드"
```

---

## Task 2: FlightActivityAttributes + 로컬 Expo 모듈

JS에서 호출할 ActivityKit 브리지 모듈과, 위젯 타깃·모듈이 공유할 `ActivityAttributes` 타입을 만든다.

**Files:**
- Create: `targets/flight-activity/FlightActivityAttributes.swift`
- Create: `modules/flight-live-activity/package.json`
- Create: `modules/flight-live-activity/expo-module.config.json`
- Create: `modules/flight-live-activity/ios/FlightLiveActivity.podspec`
- Create: `modules/flight-live-activity/ios/FlightLiveActivityModule.swift`
- Create: `modules/flight-live-activity/index.ts`

- [ ] **Step 1: 공유 ActivityAttributes 작성**

Create `targets/flight-activity/FlightActivityAttributes.swift`:
```swift
import ActivityKit
import Foundation

// 위젯 타깃과 로컬 Expo 모듈이 같은 타입을 공유해야 Activity<FlightActivityAttributes>가
// 양쪽에서 동일하게 동작한다. 이 파일은 위젯 타깃 폴더에 두고, 로컬 모듈 podspec이
// 상대 경로로 같은 파일을 컴파일 소스에 포함한다.
struct FlightActivityAttributes: ActivityAttributes {
  // 타이머가 시간 구동이라 런타임 갱신 상태가 없다. 빈 ContentState.
  public struct ContentState: Codable, Hashable {}

  let originName: String
  let originIata: String
  let destName: String
  let destIata: String
  let departAt: Date
  let arriveAt: Date
}
```

- [ ] **Step 2: 로컬 모듈 메타 파일 작성**

Create `modules/flight-live-activity/package.json`:
```json
{
  "name": "flight-live-activity",
  "version": "0.1.0",
  "main": "index.ts",
  "private": true
}
```

Create `modules/flight-live-activity/expo-module.config.json`:
```json
{
  "platforms": ["apple"],
  "apple": {
    "modules": ["FlightLiveActivityModule"]
  }
}
```

- [ ] **Step 3: podspec 작성 (공유 swift 파일 상대 경로 포함)**

Create `modules/flight-live-activity/ios/FlightLiveActivity.podspec`:
```ruby
require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'FlightLiveActivity'
  s.version        = package['version']
  s.summary        = 'JS↔ActivityKit bridge for flight live activity'
  s.license        = 'MIT'
  s.author         = ''
  s.homepage       = 'https://localhost'
  s.platforms      = { :ios => '16.2' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # 자체 swift + 위젯 타깃과 공유하는 FlightActivityAttributes.swift를 함께 컴파일.
  s.source_files = [
    '**/*.{h,m,mm,swift}',
    '../../../targets/flight-activity/FlightActivityAttributes.swift'
  ]
end
```

- [ ] **Step 4: 브리지 모듈 Swift 작성**

Create `modules/flight-live-activity/ios/FlightLiveActivityModule.swift`:
```swift
import ExpoModulesCore
import ActivityKit

public class FlightLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FlightLiveActivity")

    Function("isSupported") { () -> Bool in
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      return false
    }

    // 멱등: 항상 기존 액티비티를 먼저 종료한 뒤 새로 1개만 생성한다.
    AsyncFunction("start") { (attrs: [String: Any]) in
      guard #available(iOS 16.2, *) else { return }
      guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

      for activity in Activity<FlightActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }

      let departMs = (attrs["departAt"] as? Double) ?? 0
      let arriveMs = (attrs["arriveAt"] as? Double) ?? 0
      let attributes = FlightActivityAttributes(
        originName: (attrs["originName"] as? String) ?? "",
        originIata: (attrs["originIata"] as? String) ?? "",
        destName: (attrs["destName"] as? String) ?? "",
        destIata: (attrs["destIata"] as? String) ?? "",
        departAt: Date(timeIntervalSince1970: departMs / 1000),
        arriveAt: Date(timeIntervalSince1970: arriveMs / 1000)
      )
      let content = ActivityContent(
        state: FlightActivityAttributes.ContentState(),
        staleDate: attributes.arriveAt
      )
      _ = try? Activity.request(attributes: attributes, content: content, pushType: nil)
    }

    AsyncFunction("end") {
      guard #available(iOS 16.2, *) else { return }
      for activity in Activity<FlightActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }
}
```

- [ ] **Step 5: 모듈 TS 타입 작성**

Create `modules/flight-live-activity/index.ts`:
```ts
import { requireNativeModule } from "expo-modules-core";

export type FlightActivityAttrs = {
  originName: string;
  originIata: string;
  destName: string;
  destIata: string;
  departAt: number; // ms epoch
  arriveAt: number; // ms epoch
};

export type FlightLiveActivityNativeModule = {
  isSupported(): boolean;
  start(attrs: FlightActivityAttrs): Promise<void>;
  end(): Promise<void>;
};

// 모듈이 빠진 빌드(예: 안드로이드/Expo Go)에서 import만으로 크래시하지 않도록
// 첫 호출까지 requireNativeModule 평가를 미룬다.
let cached: FlightLiveActivityNativeModule | null = null;

export function getNativeModule(): FlightLiveActivityNativeModule | null {
  if (!cached) {
    try {
      cached = requireNativeModule<FlightLiveActivityNativeModule>("FlightLiveActivity");
    } catch {
      return null;
    }
  }
  return cached;
}
```

- [ ] **Step 6: prebuild로 모듈·공유파일 컴파일 확인**

Run: `npx expo prebuild -p ios --clean`
Expected: 에러 없이 완료. autolinking이 `FlightLiveActivity` 로컬 모듈을 잡고, podspec의 상대 경로 `FlightActivityAttributes.swift`가 소스에 포함된다.

Run: `grep -rl "FlightActivityAttributes" ios/Pods/ 2>/dev/null | head; echo "---"; grep -c "FlightLiveActivity" ios/Podfile.lock`
Expected: Podfile.lock에 `FlightLiveActivity`가 1회 이상 나타난다.

- [ ] **Step 7: 커밋**

```bash
git add targets/flight-activity/FlightActivityAttributes.swift modules/flight-live-activity/
git commit -m "feat(live-activity): ActivityKit 브리지 로컬 모듈 + 공유 attributes"
```

---

## Task 3: liveActivity.ts JS 래퍼 (TDD)

플랫폼 가드와 `ActiveFlight`→attributes 변환을 담당하는 얇은 래퍼. iOS가 아니거나 모듈이 없으면 graceful no-op.

**Files:**
- Create: `src/features/flight/liveActivity.ts`
- Test: `src/features/flight/__tests__/liveActivity.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/features/flight/__tests__/liveActivity.test.ts`:
```ts
import type { ActiveFlight } from "../flightTypes";

const flight: ActiveFlight = {
  id: "t1",
  origin: { iata: "ICN", name: "Incheon Intl", city: "Seoul", country: "KR", lat: 37.46, lng: 126.44 },
  destination: { iata: "NRT", name: "Narita Intl", city: "Tokyo", country: "JP", lat: 35.76, lng: 140.38 },
  departAt: 1_000_000,
  arriveAt: 9_000_000,
};

function loadWith(platformOS: string, native: any) {
  jest.resetModules();
  jest.doMock("react-native", () => ({ Platform: { OS: platformOS } }));
  jest.doMock("expo-modules-core", () => ({
    requireNativeModule: () => {
      if (!native) throw new Error("Cannot find native module");
      return native;
    },
  }));
  return require("../liveActivity");
}

describe("liveActivity", () => {
  afterEach(() => jest.resetModules());

  it("안드로이드에서는 네이티브를 호출하지 않고 조용히 no-op", async () => {
    const native = { isSupported: jest.fn(), start: jest.fn(), end: jest.fn() };
    const m = loadWith("android", native);
    await m.startFlightActivity(flight);
    await m.endFlightActivity();
    expect(native.start).not.toHaveBeenCalled();
    expect(native.end).not.toHaveBeenCalled();
  });

  it("iOS에서 모듈이 없으면 조용히 no-op", async () => {
    const m = loadWith("ios", null);
    await expect(m.startFlightActivity(flight)).resolves.toBeUndefined();
    await expect(m.endFlightActivity()).resolves.toBeUndefined();
  });

  it("iOS에서 ActiveFlight를 attributes로 변환해 start로 전달", async () => {
    const native = { isSupported: jest.fn(), start: jest.fn().mockResolvedValue(undefined), end: jest.fn().mockResolvedValue(undefined) };
    const m = loadWith("ios", native);
    await m.startFlightActivity(flight);
    expect(native.start).toHaveBeenCalledWith({
      originName: "Incheon Intl",
      originIata: "ICN",
      destName: "Narita Intl",
      destIata: "NRT",
      departAt: 1_000_000,
      arriveAt: 9_000_000,
    });
  });

  it("iOS에서 endFlightActivity는 native.end 호출", async () => {
    const native = { isSupported: jest.fn(), start: jest.fn(), end: jest.fn().mockResolvedValue(undefined) };
    const m = loadWith("ios", native);
    await m.endFlightActivity();
    expect(native.end).toHaveBeenCalledTimes(1);
  });

  it("native.start가 throw해도 startFlightActivity는 reject하지 않음", async () => {
    const native = { isSupported: jest.fn(), start: jest.fn().mockRejectedValue(new Error("boom")), end: jest.fn() };
    const m = loadWith("ios", native);
    await expect(m.startFlightActivity(flight)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `yarn jest src/features/flight/__tests__/liveActivity.test.ts`
Expected: FAIL — `Cannot find module '../liveActivity'`

- [ ] **Step 3: 래퍼 구현**

Create `src/features/flight/liveActivity.ts`:
```ts
import { Platform } from "react-native";
import { requireNativeModule } from "expo-modules-core";

import type { ActiveFlight } from "./flightTypes";

type NativeModule = {
  isSupported(): boolean;
  start(attrs: {
    originName: string;
    originIata: string;
    destName: string;
    destIata: string;
    departAt: number;
    arriveAt: number;
  }): Promise<void>;
  end(): Promise<void>;
};

// 첫 호출까지 requireNativeModule 평가를 미뤄, 모듈이 빠진 빌드에서 import만으로
// 크래시하지 않도록 한다. iOS가 아니면 아예 네이티브를 건드리지 않는다.
let cached: NativeModule | null = null;
function native(): NativeModule | null {
  if (Platform.OS !== "ios") return null;
  if (!cached) {
    try {
      cached = requireNativeModule<NativeModule>("FlightLiveActivity");
    } catch {
      return null;
    }
  }
  return cached;
}

export async function startFlightActivity(f: ActiveFlight): Promise<void> {
  const m = native();
  if (!m) return;
  try {
    await m.start({
      originName: f.origin.name,
      originIata: f.origin.iata,
      destName: f.destination.name,
      destIata: f.destination.iata,
      departAt: f.departAt,
      arriveAt: f.arriveAt,
    });
  } catch (e) {
    // 라이브액티비티 실패는 비행 동작 자체에 영향이 없다 — 조용히 무시.
    if (__DEV__) console.warn("[liveActivity] start failed:", e);
  }
}

export async function endFlightActivity(): Promise<void> {
  const m = native();
  if (!m) return;
  try {
    await m.end();
  } catch (e) {
    if (__DEV__) console.warn("[liveActivity] end failed:", e);
  }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `yarn jest src/features/flight/__tests__/liveActivity.test.ts`
Expected: PASS — 5개 테스트 모두 통과

- [ ] **Step 5: 커밋**

```bash
git add src/features/flight/liveActivity.ts src/features/flight/__tests__/liveActivity.test.ts
git commit -m "feat(live-activity): ActiveFlight→ActivityKit JS 래퍼"
```

---

## Task 4: flightStore 연결 (TDD)

`flightStore`의 라이프사이클 지점에서 라이브액티비티를 시작·종료한다.

**Files:**
- Modify: `src/features/flight/flightStore.ts`
- Test: `src/features/flight/__tests__/flightStore.liveActivity.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/features/flight/__tests__/flightStore.liveActivity.test.ts`:
```ts
import type { ActiveFlight } from "../flightTypes";

const ICN = { iata: "ICN", name: "Incheon Intl", city: "Seoul", country: "KR", lat: 37.46, lng: 126.44 };
const NRT = { iata: "NRT", name: "Narita Intl", city: "Tokyo", country: "JP", lat: 35.76, lng: 140.38 };

const startFlightActivity = jest.fn().mockResolvedValue(undefined);
const endFlightActivity = jest.fn().mockResolvedValue(undefined);
let loaded: ActiveFlight | null = null;
const saveActiveFlight = jest.fn().mockResolvedValue(undefined);

jest.mock("../liveActivity", () => ({
  startFlightActivity: (...a: unknown[]) => startFlightActivity(...a),
  endFlightActivity: (...a: unknown[]) => endFlightActivity(...a),
}));
jest.mock("../flightStorage", () => ({
  loadActiveFlight: () => Promise.resolve(loaded),
  saveActiveFlight: (...a: unknown[]) => saveActiveFlight(...a),
}));
jest.mock("../../../lib/tracking", () => ({ track: jest.fn() }));

function freshStore() {
  jest.resetModules();
  return require("../flightStore").useFlightStore;
}

describe("flightStore × liveActivity", () => {
  beforeEach(() => {
    startFlightActivity.mockClear();
    endFlightActivity.mockClear();
    saveActiveFlight.mockClear();
    loaded = null;
  });

  it("start()는 라이브액티비티를 시작한다", async () => {
    const useFlightStore = freshStore();
    await useFlightStore.getState().start(ICN, NRT, 1000, 9000);
    expect(startFlightActivity).toHaveBeenCalledTimes(1);
    expect(startFlightActivity.mock.calls[0][0]).toMatchObject({ origin: ICN, destination: NRT });
  });

  it("cancel()은 라이브액티비티를 종료한다", async () => {
    const useFlightStore = freshStore();
    await useFlightStore.getState().start(ICN, NRT, 1000, Date.now() + 60_000);
    await useFlightStore.getState().cancel();
    expect(endFlightActivity).toHaveBeenCalledTimes(1);
  });

  it("checkArrival()이 도착을 감지하면 라이브액티비티를 종료한다", async () => {
    const useFlightStore = freshStore();
    const past = Date.now() - 1000;
    await useFlightStore.getState().start(ICN, NRT, past - 60_000, past);
    endFlightActivity.mockClear();
    await useFlightStore.getState().checkArrival();
    expect(endFlightActivity).toHaveBeenCalledTimes(1);
  });

  it("hydrate()에서 진행 중 비행이 있으면 라이브액티비티를 재동기화한다", async () => {
    loaded = {
      id: "x", origin: ICN, destination: NRT,
      departAt: Date.now() - 1000, arriveAt: Date.now() + 60_000,
    };
    const useFlightStore = freshStore();
    await useFlightStore.getState().hydrate();
    expect(startFlightActivity).toHaveBeenCalledTimes(1);
    expect(endFlightActivity).not.toHaveBeenCalled();
  });

  it("hydrate()에서 앱이 꺼진 동안 도착했으면 라이브액티비티를 종료한다", async () => {
    loaded = {
      id: "x", origin: ICN, destination: NRT,
      departAt: Date.now() - 120_000, arriveAt: Date.now() - 1000,
    };
    const useFlightStore = freshStore();
    await useFlightStore.getState().hydrate();
    expect(endFlightActivity).toHaveBeenCalledTimes(1);
    expect(startFlightActivity).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `yarn jest src/features/flight/__tests__/flightStore.liveActivity.test.ts`
Expected: FAIL — `start()는 라이브액티비티를 시작한다` 등에서 `startFlightActivity`/`endFlightActivity`가 호출되지 않아 실패

- [ ] **Step 3: flightStore에 연결 추가**

Modify `src/features/flight/flightStore.ts`.

import 블록 끝(`import { loadActiveFlight, saveActiveFlight } from "./flightStorage";` 다음 줄)에 추가:
```ts
import { startFlightActivity, endFlightActivity } from "./liveActivity";
```

`hydrate`를 다음으로 교체:
```ts
  hydrate: async () => {
    const loaded = await loadActiveFlight();
    if (loaded && Date.now() >= loaded.arriveAt) {
      // 앱이 닫혀 있는 동안 비행이 끝났다 — 도착 토스트는 한 번 띄워준다.
      await saveActiveFlight(null);
      logArrived(loaded, "background");
      void endFlightActivity();
      set({ active: null, arrived: loaded, hydrated: true });
      return;
    }
    if (loaded) {
      // 진행 중 비행 — 라이브액티비티를 멱등 재동기화(기존 1개로 정리 후 재생성).
      void startFlightActivity(loaded);
    }
    set({ active: loaded, hydrated: true });
  },
```

`start`의 `set({ active: flight, arrived: null });` 다음 줄에 추가:
```ts
    void startFlightActivity(flight);
```

`cancel`을 다음으로 교체:
```ts
  cancel: async () => {
    await saveActiveFlight(null);
    void endFlightActivity();
    set({ active: null });
  },
```

`checkArrival`의 `logArrived(a, "foreground");` 다음 줄에 추가:
```ts
    void endFlightActivity();
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `yarn jest src/features/flight/__tests__/flightStore.liveActivity.test.ts`
Expected: PASS — 5개 테스트 모두 통과

- [ ] **Step 5: flight 전체 테스트 회귀 확인**

Run: `yarn jest src/features/flight`
Expected: PASS — 기존 테스트 포함 전부 통과

- [ ] **Step 6: 커밋**

```bash
git add src/features/flight/flightStore.ts src/features/flight/__tests__/flightStore.liveActivity.test.ts
git commit -m "feat(live-activity): flightStore 라이프사이클에 라이브액티비티 연결"
```

---

## Task 5: 위젯 UI — 경로선·비행기·잠금화면·Dynamic Island

플레이스홀더 위젯을 실제 비행 라이브액티비티 UI로 교체한다. 경로선·비행기 구현이 핵심이며, 비행기 이동 방식은 스파이크로 확정한다.

**Files:**
- Create: `targets/flight-activity/RouteLineView.swift`
- Create: `targets/flight-activity/LockScreenView.swift`
- Create: `targets/flight-activity/DynamicIslandView.swift`
- Modify: `targets/flight-activity/FlightActivityWidget.swift` (플레이스홀더 → 실제 위젯)

- [ ] **Step 1: 경로선·비행기 뷰 작성 (스파이크 포함)**

Create `targets/flight-activity/RouteLineView.swift`:
```swift
import SwiftUI
import WidgetKit

// 출발지(●)에서 도착지(○)를 잇는 일자선. 지나온 구간은 실선, 남은 구간은 점선,
// 경계에 비행기. ProgressView(timerInterval:)는 푸시 없이 iOS가 자동 갱신한다.
struct RouteLineView: View {
  let departAt: Date
  let arriveAt: Date

  var body: some View {
    GeometryReader { geo in
      ZStack(alignment: .leading) {
        // 전체 경로: 점선
        Rectangle()
          .fill(.secondary.opacity(0.4))
          .frame(height: 2)
          .frame(maxHeight: .infinity, alignment: .center)

        // 지나온 경로 + 비행기
        ProgressView(timerInterval: departAt...arriveAt, countsDown: false) {
          EmptyView()
        } currentValueLabel: {
          EmptyView()
        }
        .progressViewStyle(FlightProgressStyle(width: geo.size.width))
      }
      .overlay(alignment: .leading) {
        Circle().fill(.primary).frame(width: 7, height: 7)
      }
      .overlay(alignment: .trailing) {
        Circle().strokeBorder(.primary, lineWidth: 1.5).frame(width: 7, height: 7)
      }
    }
    .frame(height: 16)
  }
}

// 스파이크 지점: timerInterval ProgressView에서 커스텀 스타일이 fractionCompleted를
// 노출하는지가 iOS 버전에 따라 불확실하다. 노출되면 비행기가 fill 선두를 따라 이동한다.
struct FlightProgressStyle: ProgressViewStyle {
  let width: CGFloat

  func makeBody(configuration: Configuration) -> some View {
    let fraction = configuration.fractionCompleted ?? 0
    let x = max(0, min(width, width * fraction))
    return ZStack(alignment: .leading) {
      Capsule()
        .fill(.tint)
        .frame(width: x, height: 2)
        .frame(maxHeight: .infinity, alignment: .center)
      Image(systemName: "airplane")
        .font(.system(size: 13))
        .foregroundStyle(.tint)
        .offset(x: x - 7)
    }
  }
}
```

> **스파이크 판정 (Step 5의 dev build에서 확인):** dev build에서 라이브액티비티를 띄웠을 때 비행기가 시간에 따라 이동하면 위 코드 그대로 둔다. 비행기가 출발지에 멈춰 있으면(= `fractionCompleted`가 nil) 아래 폴백으로 `RouteLineView`를 교체한다.
>
> **폴백 — 비행기는 도착지 끝 고정, 실선 fill이 차오르며 진행 표현:**
> ```swift
> import SwiftUI
> import WidgetKit
>
> struct RouteLineView: View {
>   let departAt: Date
>   let arriveAt: Date
>
>   var body: some View {
>     ZStack {
>       Rectangle()
>         .fill(.secondary.opacity(0.4))
>         .frame(height: 2)
>       ProgressView(timerInterval: departAt...arriveAt, countsDown: false) {
>         EmptyView()
>       } currentValueLabel: {
>         EmptyView()
>       }
>       .labelsHidden()
>       .tint(.primary)
>       .frame(height: 2)
>     }
>     .overlay(alignment: .leading) {
>       Circle().fill(.primary).frame(width: 7, height: 7)
>     }
>     .overlay(alignment: .trailing) {
>       Image(systemName: "airplane")
>         .font(.system(size: 13))
>         .foregroundStyle(.primary)
>     }
>     .frame(height: 16)
>   }
> }
> ```
> 폴백을 채택하면 `FlightProgressStyle` struct는 삭제한다.

- [ ] **Step 2: 잠금화면 카드 뷰 작성**

Create `targets/flight-activity/LockScreenView.swift`:
```swift
import SwiftUI

struct LockScreenView: View {
  let attributes: FlightActivityAttributes

  var body: some View {
    VStack(spacing: 10) {
      HStack {
        Text(attributes.originName)
          .font(.caption).fontWeight(.semibold)
          .lineLimit(1)
        Spacer(minLength: 12)
        Text(attributes.destName)
          .font(.caption).fontWeight(.semibold)
          .lineLimit(1)
      }
      RouteLineView(departAt: attributes.departAt, arriveAt: attributes.arriveAt)
      Text(timerInterval: attributes.departAt...attributes.arriveAt, countsDown: true)
        .font(.title3).monospacedDigit()
        .frame(maxWidth: .infinity)
        .multilineTextAlignment(.center)
    }
    .padding(14)
  }
}
```

- [ ] **Step 3: Dynamic Island expanded 뷰 작성**

Create `targets/flight-activity/DynamicIslandView.swift`:
```swift
import SwiftUI

// Dynamic Island expanded bottom 영역. 경로선 + 남은 시간.
struct DynamicIslandBottomView: View {
  let attributes: FlightActivityAttributes

  var body: some View {
    VStack(spacing: 8) {
      RouteLineView(departAt: attributes.departAt, arriveAt: attributes.arriveAt)
      Text(timerInterval: attributes.departAt...attributes.arriveAt, countsDown: true)
        .font(.title3).monospacedDigit()
        .frame(maxWidth: .infinity)
        .multilineTextAlignment(.center)
    }
  }
}
```

- [ ] **Step 4: 위젯 진입점을 실제 라이브액티비티로 교체**

Replace `targets/flight-activity/FlightActivityWidget.swift` 전체:
```swift
import ActivityKit
import WidgetKit
import SwiftUI

@main
struct FlightActivityBundle: WidgetBundle {
  var body: some Widget {
    FlightActivityWidget()
  }
}

struct FlightActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: FlightActivityAttributes.self) { context in
      // 잠금화면 / 배너
      LockScreenView(attributes: context.attributes)
        .activitySystemActionForegroundColor(.primary)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Text(context.attributes.originIata)
            .font(.caption).fontWeight(.bold)
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(context.attributes.destIata)
            .font(.caption).fontWeight(.bold)
        }
        DynamicIslandExpandedRegion(.bottom) {
          DynamicIslandBottomView(attributes: context.attributes)
        }
      } compactLeading: {
        Image(systemName: "airplane")
      } compactTrailing: {
        Text(timerInterval: context.attributes.departAt...context.attributes.arriveAt,
             countsDown: true)
          .monospacedDigit()
          .frame(width: 44)
      } minimal: {
        Image(systemName: "airplane")
      }
    }
  }
}
```

- [ ] **Step 5: prebuild + dev build로 위젯 컴파일·렌더 확인 (스파이크 판정)**

Run: `npx expo prebuild -p ios --clean && npx expo run:ios`
Expected: 빌드 성공, 앱이 시뮬레이터/기기에 설치된다.

확인 절차:
1. 앱에서 짧은 비행을 시작한다 (가능한 한 짧게, 예: 출발 직후 ~3분 도착).
2. 잠금화면으로 나가 라이브액티비티 카드가 보이는지 확인 — 좌/우 공항명, 일자선, 비행기, 남은 시간 카운트다운.
3. 1~2분 관찰: **비행기가 출발지→도착지로 이동하는가?**
   - 이동함 → Step 1 코드 그대로 유지.
   - 출발지에 멈춰 있음 → Step 1의 폴백 `RouteLineView`로 교체하고 `FlightProgressStyle` 삭제 후 `npx expo run:ios` 재빌드해 다시 확인.
4. Dynamic Island compact(✈ + 남은 시간), 길게 눌러 expanded(공항 IATA + 경로선 + 남은 시간) 확인.

- [ ] **Step 6: 커밋**

```bash
git add targets/flight-activity/
git commit -m "feat(live-activity): 비행 경로선·잠금화면·Dynamic Island 위젯 UI"
```

---

## Task 6: 종료·중복 라이프사이클 dev build 검증

위젯 UI가 보이는 상태에서 라이프사이클(종료·재시작·중복 방지)을 실제 기기/시뮬레이터로 검증한다. 자동화 불가 — 수동 체크리스트.

**Files:** 없음 (검증만)

- [ ] **Step 1: 도착 시 자동 종료 검증**

dev build에서 짧은 비행을 시작하고 도착 시각까지 기다린다.
Expected: 도착 시각 도달 후 라이브액티비티가 사라진다 (앱이 포그라운드면 `checkArrival`, 백그라운드였다가 복귀하면 `hydrate`/`checkArrival` 경로).

- [ ] **Step 2: 취소 시 즉시 종료 검증**

비행을 시작한 뒤 앱에서 비행을 취소한다.
Expected: 라이브액티비티가 즉시 사라진다.

- [ ] **Step 3: 앱 강제종료 후 재실행 — 중복 방지 검증**

비행을 시작한 뒤 앱을 강제 종료하고, 다시 실행한다.
Expected: 잠금화면에 라이브액티비티가 **정확히 1개만** 유지된다 (`hydrate`의 멱등 `startFlightActivity`가 기존 1개로 정리 후 재생성).

- [ ] **Step 4: 라이브액티비티 비활성 사용자 — graceful 동작 검증**

설정 > VisitGrid에서 "실시간 활동(Live Activities)"을 끈 뒤 비행을 시작한다.
Expected: 앱이 정상 동작하고 크래시·에러 없음. 라이브액티비티만 표시되지 않는다.

- [ ] **Step 5: 전체 jest 회귀 확인**

Run: `yarn jest`
Expected: PASS — 전체 테스트 통과

- [ ] **Step 6: 검증 완료 커밋 (문서)**

검증 중 코드 수정이 있었다면 해당 변경을 커밋한다. 수정이 없었다면 이 단계는 건너뛴다.

```bash
git status   # 변경 없으면 커밋 생략
```

---

## Self-Review 결과

**1. Spec coverage:**
- 아키텍처 4단위(위젯 타깃 / 로컬 모듈 / JS 래퍼 / store 연결) → Task 1·5 / Task 2 / Task 3 / Task 4 ✓
- 데이터 흐름(푸시·백그라운드 없음, timerInterval 자동 갱신) → Task 2의 Swift, Task 5의 위젯 ✓
- 잠금화면 카드 UI → Task 5 Step 2 ✓
- Dynamic Island compact/minimal/expanded → Task 5 Step 4 ✓
- 비행기 이동 제약 + 스파이크 + 폴백 → Task 5 Step 1·5 ✓
- 빌드 설정(@bacons/apple-targets, NSSupportsLiveActivities) → Task 1 ✓
- 엣지케이스(권한 off / 백그라운드 도착 / 중복) → Task 4 테스트 + Task 6 검증 ✓
- i18n → 위젯에 정적 라벨 없음, 신규 키 불필요 (헤더에 명시) ✓
- App Group → 런타임 공유 데이터가 없어 불필요. 타입 공유는 podspec 상대경로 컴파일로 해결 (Task 2 Step 3). 스펙의 App Group 항목 대비 축소했고 사유 문서화함.

**2. Placeholder scan:** "TBD"/"TODO"/막연한 지시 없음. 모든 코드 스텝에 완전한 코드 포함.

**3. Type consistency:** `FlightActivityAttributes`(originName/originIata/destName/destIata/departAt/arriveAt)가 Swift 구조체·모듈·JS 래퍼·테스트에서 동일. `startFlightActivity`/`endFlightActivity` 이름이 래퍼·store·테스트에서 일치. `RouteLineView(departAt:arriveAt:)` 시그니처가 정의·호출부에서 일치.
