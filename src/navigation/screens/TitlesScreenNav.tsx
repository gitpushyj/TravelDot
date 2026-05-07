import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import TitlesScreen from "../../screens/TitlesScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function TitlesScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Titles">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <TitlesScreen
        onClose={() => navigation.goBack()}
        // 마일스톤 ↔ 호칭 사이는 백스택을 쌓지 않고 항상 단일 슬롯에서 교체.
        onOpenMilestones={() => navigation.replace("Milestones")}
      />
    </>
  );
}
