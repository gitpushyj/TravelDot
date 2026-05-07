import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import OnboardingScreen from "../../screens/OnboardingScreen";
import type { RootStackParamList } from "../types";

export default function ChangeHomeScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ChangeHome">) {
  return (
    <>
      <StatusBar style="light" />
      <OnboardingScreen mode="change" onClose={() => navigation.goBack()} />
    </>
  );
}
