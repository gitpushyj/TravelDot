import { Platform } from "react-native";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";

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
