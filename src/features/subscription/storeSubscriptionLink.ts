import { Linking, Platform } from "react-native";

// Apple/Google 모두 https URL을 자동으로 스토어 앱으로 라우팅한다.
// 별도 itms-apps:// scheme은 불필요.
const IOS_SUBSCRIPTION_URL = "https://apps.apple.com/account/subscriptions";
const ANDROID_SUBSCRIPTION_URL =
  "https://play.google.com/store/account/subscriptions";

// App Store Review Guideline 5.1.1(v) — 앱이 IAP 구독을 직접 해지할 수 없으므로
// 사용자가 스토어 구독 관리 화면에서 직접 해지하도록 deep link로 보낸다.
export async function openStoreSubscriptionManagement(): Promise<void> {
  const url =
    Platform.OS === "ios" ? IOS_SUBSCRIPTION_URL : ANDROID_SUBSCRIPTION_URL;
  await Linking.openURL(url);
}
