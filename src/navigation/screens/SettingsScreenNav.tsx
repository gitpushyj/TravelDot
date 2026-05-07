import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import SettingsScreen from "../../screens/SettingsScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function SettingsScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Settings">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <SettingsScreen
        onClose={() => navigation.goBack()}
        onAddTrip={() => navigation.navigate("AddTrip")}
        onOpenTitles={() => navigation.navigate("Titles")}
        onChangeHome={() => navigation.navigate("ChangeHome")}
        onReviewSuspect={() => navigation.navigate("ReviewSuspect")}
        onOpenLanguage={() => navigation.navigate("Language")}
      />
    </>
  );
}
