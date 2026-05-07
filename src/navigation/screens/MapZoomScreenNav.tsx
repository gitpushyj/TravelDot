import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import MapZoomScreen from "../../screens/MapZoomScreen";
import { useAppCtx } from "../AppCtx";
import type { RootStackParamList } from "../types";

export default function MapZoomScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "MapZoom">) {
  const { activeCounts } = useAppCtx();
  return (
    <MapZoomScreen
      visitCounts={activeCounts}
      onClose={() => navigation.goBack()}
    />
  );
}
