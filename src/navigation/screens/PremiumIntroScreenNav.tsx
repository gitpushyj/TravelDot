import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import PremiumIntroScreen from "../../screens/PremiumIntroScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function PremiumIntroScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "PremiumIntro">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <PremiumIntroScreen
        onGoToSubscription={() => {
          navigation.navigate("Main", { screen: "AI" });
          navigation.replace("Subscription");
        }}
        onDismiss={() => navigation.navigate("Main", { screen: "AI" })}
      />
    </>
  );
}
