import { StatusBar } from "expo-status-bar";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import SettingsScreen from "../../screens/SettingsScreen";
import { useTheme } from "../../theme/themeStore";
import type { MainTabParamList, RootStackParamList } from "../types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Settings">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function SettingsScreenNav({ navigation }: Props) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <SettingsScreen
        onAddTrip={() => navigation.navigate("AddTrip")}
        onOpenTitles={() => navigation.navigate("Titles")}
        onOpenMilestones={() => navigation.navigate("Milestones")}
        onChangeHome={() => navigation.navigate("ChangeHome")}
        onReviewSuspect={() => navigation.navigate("ReviewSuspect")}
        onOpenLanguage={() => navigation.navigate("Language")}
      />
    </>
  );
}
