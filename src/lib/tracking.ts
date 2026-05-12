import { Platform } from "react-native";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import analytics from "@react-native-firebase/analytics";

let promptedThisSession = false;

// iOS 14.5+ App Tracking Transparency. Android는 시스템 설정에서 사용자가
// 직접 제어하므로 호출 필요 없음. 권한이 거부되어도 Firebase Analytics는
// IDFA 없이 익명 데이터만 수집하며 정상 동작한다.
export async function requestTrackingPermissionIfNeeded() {
  if (Platform.OS !== "ios") return;
  if (promptedThisSession) return;
  promptedThisSession = true;
  try {
    const { status, canAskAgain } = await getTrackingPermissionsAsync();
    if (status === "undetermined" && canAskAgain) {
      await requestTrackingPermissionsAsync();
    }
  } catch {
    // 권한 모듈 호출 실패는 무시. 분석은 계속 동작한다.
  }
}

// Firebase Analytics 이벤트 로깅. 실패해도 앱 흐름엔 영향 없게 fire-and-forget.
// param 값은 string/number/boolean만 가능 (Firebase 제약). 객체/배열은 평탄화하거나
// 미리 string으로 직렬화해서 전달.
export function track(event: string, params?: Record<string, unknown>) {
  analytics()
    .logEvent(event, params as Record<string, unknown> | undefined)
    .catch(() => {});
}

// 사용자 속성. 결제 tier 같은 "유저의 항구적 속성"을 설정해두면 Firebase Console에서
// 이벤트 데이터를 그 속성으로 슬라이스해 볼 수 있다. null이면 속성 제거.
export function setUserProperty(key: string, value: string | null) {
  analytics()
    .setUserProperty(key, value)
    .catch(() => {});
}
