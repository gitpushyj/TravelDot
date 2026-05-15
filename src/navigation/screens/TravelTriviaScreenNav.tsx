import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { TravelTriviaScreen } from "../../features/travelTrivia/TravelTriviaScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function TravelTriviaScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "TravelTrivia">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <TravelTriviaScreen
        onClose={() => navigation.goBack()}
        onViewRanking={() => navigation.navigate("TravelTriviaLeaderboard")}
      />
    </>
  );
}
