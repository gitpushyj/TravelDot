import { StatusBar } from "expo-status-bar";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import AllCountriesScreen from "../../screens/AllCountriesScreen";
import { useVisitStore } from "../../features/travel/visitStore";
import { useTheme } from "../../theme/themeStore";
import type { MainTabParamList, RootStackParamList } from "../types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "AllCountries">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function AllCountriesScreenNav({ navigation }: Props) {
  const theme = useTheme();
  const setSelectedCountry = useVisitStore((s) => s.setSelectedCountry);
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <AllCountriesScreen
        onSelectCountry={(c) => {
          setSelectedCountry({ code: c.code, name: c.nameKo });
          navigation.navigate("CountryDetail");
        }}
      />
    </>
  );
}
