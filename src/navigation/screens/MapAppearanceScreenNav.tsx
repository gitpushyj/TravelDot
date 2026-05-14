import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import MapAppearanceScreen from "../../screens/MapAppearanceScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function MapAppearanceScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "MapAppearance">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <MapAppearanceScreen onClose={() => navigation.goBack()} />
    </>
  );
}
