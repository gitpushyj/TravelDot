import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import HistoryScreen from "../../screens/HistoryScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function HistoryScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "History">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <HistoryScreen
        onClose={() => navigation.goBack()}
        onSelectTrip={(trip) => navigation.navigate("TripDetail", { trip })}
      />
    </>
  );
}
