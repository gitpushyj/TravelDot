import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import SubscriptionScreen from "../../screens/SubscriptionScreen";
import type { PaywallSource } from "../../lib/analyticsEvents";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

// route.params.analyticsSource는 string으로 넘어오지만 잘 알려진 값이면
// PaywallSource로 좁혀 SubscriptionScreen이 한 번에 강타입으로 받는다.
const KNOWN_SOURCES: readonly PaywallSource[] = [
  "settings",
  "premium_intro",
  "milestones",
  "ai_tab",
  "feature_gate",
];
function asPaywallSource(s: string | undefined): PaywallSource {
  if (s && (KNOWN_SOURCES as readonly string[]).includes(s)) {
    return s as PaywallSource;
  }
  return "unknown";
}

export default function SubscriptionScreenNav({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "Subscription">) {
  const theme = useTheme();
  const returnToTab = route.params?.returnToTab;

  // returnToTab이 지정되면 X 버튼이 해당 탭으로 곧장 보낸다 — 보통 PremiumIntro를
  // 거쳐 들어온 경우(예: 채팅 → 안내 → 구독)에서 닫을 때 원래 탭으로 복귀시키기 위함.
  // 없으면 goBack으로 호출 화면(설정 등)에 자연 복귀.
  const handleClose = () => {
    if (returnToTab) {
      navigation.navigate("Main", { screen: returnToTab });
    } else {
      navigation.goBack();
    }
  };

  const source = asPaywallSource(route.params?.analyticsSource);

  return (
    <>
      <StatusBar style={theme.statusBar} />
      <SubscriptionScreen onClose={handleClose} source={source} />
    </>
  );
}
