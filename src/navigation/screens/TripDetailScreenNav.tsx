import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import TripDetailScreen from "../../screens/TripDetailScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function TripDetailScreenNav({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "TripDetail">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <TripDetailScreen
        trip={route.params.trip}
        onClose={() => navigation.goBack()}
        onEdit={() =>
          navigation.navigate("EditTrip", { trip: route.params.trip })
        }
        onSelectPhoto={(args) => navigation.navigate("ImageDetail", args)}
      />
    </>
  );
}
