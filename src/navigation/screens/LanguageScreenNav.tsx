import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import LanguageScreen from "../../screens/LanguageScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function LanguageScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Language">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <LanguageScreen onClose={() => navigation.goBack()} />
    </>
  );
}
