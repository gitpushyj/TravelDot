import { StatusBar } from "expo-status-bar";
import { Alert } from "react-native";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { runIncrementalSync } from "../../features/photoSync/syncService";
import HistoryScreen from "../../screens/HistoryScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function HistoryScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "History">) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <HistoryScreen
        onClose={() => navigation.goBack()}
        onSelectTrip={(trip) => navigation.navigate("TripDetail", { trip })}
        onMergeHint={(countryCode) =>
          navigation.navigate("CountryMerge", { countryCode })
        }
        onAddManual={() => navigation.navigate("AddTrip")}
        onAddAutoScan={() => {
          runIncrementalSync().catch((e) =>
            Alert.alert(t("scan.scanFailed"), String(e))
          );
        }}
      />
    </>
  );
}
