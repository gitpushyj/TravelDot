import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import CountryDetailScreen from "../../screens/CountryDetailScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function CountryDetailScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "CountryDetail">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <CountryDetailScreen
        onClose={() => navigation.goBack()}
        onSelectTrip={(trip) => navigation.navigate("TripDetail", { trip })}
      />
    </>
  );
}
