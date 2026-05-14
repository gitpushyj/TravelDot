import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import SubscriptionScreen from "../../screens/SubscriptionScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

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

  return (
    <>
      <StatusBar style={theme.statusBar} />
      <SubscriptionScreen onClose={handleClose} />
    </>
  );
}
