import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import AddTripScreen from "../../screens/AddTripScreen";
import type { RootStackParamList } from "../types";

export default function AddTripScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "AddTrip">) {
  return (
    <>
      <StatusBar style="light" />
      <AddTripScreen onClose={() => navigation.goBack()} />
    </>
  );
}
