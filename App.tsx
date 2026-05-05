import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import MapView from "./src/components/MapView";
import { BG_COLOR } from "./src/utils/heatmap";

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>VisitGrid</Text>
        <Text style={styles.subtitle}>여행을 도트로 수집하다</Text>
      </View>
      <View style={styles.mapWrap}>
        <MapView />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_COLOR,
    paddingTop: 36,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    color: "#e8eefc",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#7d8aa6",
    fontSize: 13,
    marginTop: 2,
  },
  mapWrap: {
    flex: 1,
  },
});
