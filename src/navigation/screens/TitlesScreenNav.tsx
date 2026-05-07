import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import TitlesScreen from "../../screens/TitlesScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function TitlesScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Titles">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <TitlesScreen onClose={() => navigation.goBack()} />
    </>
  );
}
