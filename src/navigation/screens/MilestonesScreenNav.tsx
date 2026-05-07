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
        onOpenTitles={() => navigation.navigate("Titles")}
      />
    </>
  );
}
