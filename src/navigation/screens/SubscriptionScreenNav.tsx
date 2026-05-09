import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import SubscriptionScreen from "../../screens/SubscriptionScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function SubscriptionScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Subscription">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <SubscriptionScreen onClose={() => navigation.goBack()} />
    </>
  );
}
