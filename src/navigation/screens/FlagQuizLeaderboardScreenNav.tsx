import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { FlagQuizLeaderboardScreen } from "../../features/flagQuiz/FlagQuizLeaderboardScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function FlagQuizLeaderboardScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "FlagQuizLeaderboard">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <FlagQuizLeaderboardScreen onClose={() => navigation.goBack()} />
    </>
  );
}
