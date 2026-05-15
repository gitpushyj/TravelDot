import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { FlagQuizScreen } from "../../features/flagQuiz/FlagQuizScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function FlagQuizScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "FlagQuiz">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <FlagQuizScreen onClose={() => navigation.goBack()} />
    </>
  );
}
