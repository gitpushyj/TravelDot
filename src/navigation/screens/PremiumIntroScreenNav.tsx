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

  // returnToTab이 지정되면 탭에서 호출된 것 → 해당 탭으로 active를 옮긴 뒤 닫기/이동.
  // 없으면 Root 스택의 일반 화면에서 띄운 것이므로 goBack만으로 호출 화면으로 자연 복귀.
  const restoreCaller = () => {
    if (returnToTab) {
      navigation.navigate("Main", { screen: returnToTab });
    }
  };

  return (
    <>
      <StatusBar style={theme.statusBar} />
      <PremiumIntroScreen
        onGoToSubscription={() => {
          restoreCaller();
          navigation.replace("Subscription");
        }}
        onDismiss={() => {
          if (returnToTab) {
            restoreCaller();
          } else {
            navigation.goBack();
          }
        }}
      />
    </>
  );
}
