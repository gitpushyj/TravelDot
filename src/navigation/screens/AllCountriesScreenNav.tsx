import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import AllCountriesScreen from "../../screens/AllCountriesScreen";
import { useVisitStore } from "../../features/travel/visitStore";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function AllCountriesScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "AllCountries">) {
  const theme = useTheme();
  const setSelectedCountry = useVisitStore((s) => s.setSelectedCountry);
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <AllCountriesScreen
        onClose={() => navigation.goBack()}
        onSelectCountry={(c) => {
          setSelectedCountry({ code: c.code, name: c.nameKo });
          navigation.navigate("CountryDetail");
        }}
      />
    </>
  );
}
