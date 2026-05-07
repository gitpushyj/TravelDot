import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import ReviewSuspectTripsScreen from "../../screens/ReviewSuspectTripsScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function ReviewSuspectScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ReviewSuspect">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <ReviewSuspectTripsScreen onClose={() => navigation.goBack()} />
    </>
  );
}
