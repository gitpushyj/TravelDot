import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import PremiumIntroScreen from "../../screens/PremiumIntroScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function PremiumIntroScreenNav({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "PremiumIntro">) {
  const theme = useTheme();
  const returnToTab = route.params?.returnToTab;

  return (
    <>
      <StatusBar style={theme.statusBar} />
      <PremiumIntroScreen
        onGoToSubscription={() => {
          // returnToTab을 그대로 Subscription에 넘겨, 구독 화면의 X도 동일 탭으로 복귀.
          navigation.replace(
            "Subscription",
            returnToTab ? { returnToTab } : undefined
          );
        }}
        onDismiss={() => {
          if (returnToTab) {
            navigation.navigate("Main", { screen: returnToTab });
          } else {
            navigation.goBack();
          }
        }}
      />
    </>
  );
}
