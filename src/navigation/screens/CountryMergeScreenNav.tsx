import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import CountryMergeScreen from "../../screens/CountryMergeScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function CountryMergeScreenNav({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "CountryMerge">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <CountryMergeScreen
        countryCode={route.params.countryCode}
        onClose={() => navigation.goBack()}
      />
    </>
  );
}
