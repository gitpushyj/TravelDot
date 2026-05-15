import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import GamesHubScreen from "../../screens/GamesHub/GamesHubScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function GamesHubScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "GamesHub">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <GamesHubScreen
        onClose={() => navigation.goBack()}
        onOpenFlagQuiz={() => navigation.navigate("FlagQuiz")}
      />
    </>
  );
}
