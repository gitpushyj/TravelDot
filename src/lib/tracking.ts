// Firebase Analytics 래퍼.
//
// 모든 외부 의존(react-native, expo-tracking-transparency, @react-native-firebase/analytics)은
// 함수 내부에서 lazy require한다. 이유: 이 모듈은 store들이 widely import하는데, jest는
// react-native ESM을 transform하지 않으므로 top-level import가 있으면 그 store를 테스트하는
// 모든 spec이 깨진다. lazy require + try/catch로 테스트/SSR 환경에서는 no-op이 된다.
// 앱 런타임에서는 정상 동작한다.

let promptedThisSession = false;

function getAnalytics(): {
  logEvent: (event: string, params?: Record<string, unknown>) => Promise<unknown>;
  setUserProperty: (key: string, value: string | null) => Promise<unknown>;
  setUserId: (id: string | null) => Promise<unknown>;
  logScreenView: (params: {
    screen_name: string;
    screen_class?: string;
  }) => Promise<unknown>;
  logLogin: (params: { method: string }) => Promise<unknown>;
  logSignUp: (params: { method: string }) => Promise<unknown>;
  logPurchase: (params: {
    value: number;
    currency: string;
    transaction_id?: string;
    items?: Array<{ item_id: string; item_name?: string }>;
  }) => Promise<unknown>;
  logTutorialBegin: () => Promise<unknown>;
  logTutorialComplete: () => Promise<unknown>;
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@react-native-firebase/analytics");
    const factory = (mod.default ?? mod) as () => ReturnType<typeof getAnalytics>;
    return factory() as ReturnType<typeof getAnalytics>;
  } catch {
    return null;
  }
}

// iOS 14.5+ App Tracking Transparency. Android는 시스템 설정에서 사용자가
// 직접 제어하므로 호출 필요 없음. 권한이 거부되어도 Firebase Analytics는
// IDFA 없이 익명 데이터만 수집하며 정상 동작한다.
export async function requestTrackingPermissionIfNeeded() {
  if (promptedThisSession) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require("react-native") as typeof import("react-native");
    if (Platform.OS !== "ios") return;
    promptedThisSession = true;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const att = require("expo-tracking-transparency") as typeof import("expo-tracking-transparency");
    const { status, canAskAgain } = await att.getTrackingPermissionsAsync();
    if (status === "undetermined" && canAskAgain) {
      await att.requestTrackingPermissionsAsync();
    }
  } catch {
    // 권한 모듈 로드/호출 실패는 무시. 분석은 계속 동작한다.
  }
}

// Firebase Analytics 이벤트 로깅. 실패해도 앱 흐름엔 영향 없게 fire-and-forget.
// param 값은 string/number/boolean만 가능 (Firebase 제약). 객체/배열은 평탄화하거나
// 미리 string으로 직렬화해서 전달.
export function track(event: string, params?: Record<string, unknown>) {
  getAnalytics()
    ?.logEvent(event, params)
    .catch(() => {});
}

// 사용자 속성. 결제 tier 같은 "유저의 항구적 속성"을 설정해두면 Firebase Console에서
// 이벤트 데이터를 그 속성으로 슬라이스해 볼 수 있다. null이면 속성 제거.
export function setUserProperty(key: string, value: string | null) {
  getAnalytics()
    ?.setUserProperty(key, value)
    .catch(() => {});
}

// 로그인된 사용자 ID 설정. Firebase는 이 값으로 cross-device user를 묶고
// User Explorer/Audience 분석에 사용한다. 로그아웃 시 null로 비운다.
export function setUserId(userId: string | null) {
  getAnalytics()
    ?.setUserId(userId)
    .catch(() => {});
}

// 화면 전환 이벤트. Firebase 표준 이벤트라 별도 메서드로 로깅하면
// 콘솔의 "Screen views" 리포트에 자동으로 잡힌다. RN의 React Navigation은
// 자동 추적되지 않으므로 navigation state 변화에서 직접 호출한다.
export function logScreenView(screenName: string, screenClass?: string) {
  getAnalytics()
    ?.logScreenView({
      screen_name: screenName,
      screen_class: screenClass ?? screenName,
    })
    .catch(() => {});
}

// 로그인 표준 이벤트. method는 "google"/"apple" 같은 provider 이름.
// Firebase 콘솔의 "User acquisition" 리포트에서 method별로 슬라이스된다.
export function logLogin(method: string) {
  getAnalytics()
    ?.logLogin({ method })
    .catch(() => {});
}

// 회원 가입 표준 이벤트. 첫 로그인이 곧 가입이므로 신규 사용자에 한해 호출한다.
export function logSignUp(method: string) {
  getAnalytics()
    ?.logSignUp({ method })
    .catch(() => {});
}

// 구매 표준 이벤트. Firebase는 이 이벤트를 매출 리포트에 자동 통합한다.
// value는 결제 금액(통화 단위), currency는 ISO 4217 코드. items는 옵션.
export function logPurchase(params: {
  value: number;
  currency: string;
  transactionId?: string;
  itemId?: string;
  itemName?: string;
}) {
  getAnalytics()
    ?.logPurchase({
      value: params.value,
      currency: params.currency,
      transaction_id: params.transactionId,
      items: params.itemId
        ? [
            {
              item_id: params.itemId,
              item_name: params.itemName ?? params.itemId,
            },
          ]
        : undefined,
    })
    .catch(() => {});
}

// 온보딩 시작/완료 표준 이벤트.
export function logTutorialBegin() {
  getAnalytics()
    ?.logTutorialBegin()
    .catch(() => {});
}

export function logTutorialComplete() {
  getAnalytics()
    ?.logTutorialComplete()
    .catch(() => {});
}
