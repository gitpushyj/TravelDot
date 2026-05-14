import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import MilestonesScreen from "../../screens/MilestonesScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function MilestonesScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Milestones">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <MilestonesScreen
        onClose={() => navigation.goBack()}
        // 마일스톤 ↔ 호칭 사이는 백스택을 쌓지 않고 항상 단일 슬롯에서 교체.
        onOpenTitles={() => navigation.replace("Titles")}
        onOpenPremiumIntro={() => navigation.navigate("PremiumIntro")}
      />
    </>
  );
}
