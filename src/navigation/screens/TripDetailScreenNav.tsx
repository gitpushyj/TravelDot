import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { useVisitStore } from "../../features/travel/visitStore";
import { getCurrentLocale } from "../../i18n";
import { getCountryName } from "../../lib/countryName";
import TripDetailScreen from "../../screens/TripDetailScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function TripDetailScreenNav({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "TripDetail">) {
  const theme = useTheme();
  const setSelectedCountry = useVisitStore((s) => s.setSelectedCountry);
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <TripDetailScreen
        trip={route.params.trip}
        onClose={() => navigation.goBack()}
        onEdit={() =>
          navigation.navigate("EditTrip", { trip: route.params.trip })
        }
        onSelectCountry={() => {
          const code = route.params.trip.countryCode;
          setSelectedCountry({
            code,
            name: getCountryName(code, getCurrentLocale()),
          });
          navigation.navigate("CountryDetail");
        }}
        onSelectPhoto={(args) => navigation.navigate("ImageDetail", args)}
      />
    </>
  );
}
