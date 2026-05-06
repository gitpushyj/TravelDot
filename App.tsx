import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import MapView from "./src/components/MapView";
import { useVisitStore } from "./src/features/travel/visitStore";
import AddTripScreen from "./src/screens/AddTripScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import { BG_COLOR } from "./src/utils/heatmap";

export default function App() {
  const ready = useVisitStore((s) => s.ready);
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const hydrate = useVisitStore((s) => s.hydrate);
  const syncStatus = useVisitStore((s) => s.syncStatus);
  const visitCounts = useVisitStore((s) => s.visitCounts);
  const lastSync = useVisitStore((s) => s.lastSync);
  const setLastSync = useVisitStore((s) => s.setLastSync);
  const [screen, setScreen] = useState<"main" | "addTrip">("main");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // 첫 스캔이 끝났을 때 결과를 한 번 Alert으로 띄워 진단을 돕는다.
  useEffect(() => {
    if (!lastSync) return;
    if (syncStatus.running) return;
    const lines = [
      `권한: ${lastSync.permission}`,
      `사진 ${lastSync.scanned}장 확인`,
      `GPS 있음: ${lastSync.withGps}장`,
      `국가 매칭: ${lastSync.resolved}장`,
      `DB 추가: ${lastSync.added}장`,
    ];
    if (lastSync.error) lines.push(`에러: ${lastSync.error}`);
    Alert.alert("스캔 결과", lines.join("\n"), [
      { text: "확인", onPress: () => setLastSync(null) },
    ]);
  }, [lastSync, syncStatus.running, setLastSync]);

  const totals = useMemo(() => {
    const codes = Object.keys(visitCounts);
    let days = 0;
    for (const c of codes) days += visitCounts[c] ?? 0;
    return { countries: codes.length, days };
  }, [visitCounts]);

  if (!ready) {
    return <View style={styles.root} />;
  }

  if (!homeCountry) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" />
        <OnboardingScreen />
      </GestureHandlerRootView>
    );
  }

  if (screen === "addTrip") {
    return (
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" />
        <AddTripScreen onClose={() => setScreen("main")} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>VisitGrid</Text>
          <Text style={styles.subtitle}>
            본국: {homeCountry.name} ({homeCountry.code}) · 방문{" "}
            {totals.countries}개국 · 총 {totals.days}일
          </Text>
        </View>
        <Pressable
          onPress={() => setScreen("addTrip")}
          style={({ pressed }) => [
            styles.addBtn,
            pressed && styles.addBtnPressed,
          ]}
          hitSlop={6}
        >
          <Text style={styles.addBtnText}>여행 추가</Text>
        </Pressable>
      </View>
      {syncStatus.running && (
        <View style={styles.syncBar}>
          <Text style={styles.syncText}>
            사진 스캔 중 · {syncStatus.processed}장 처리됨
          </Text>
        </View>
      )}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: { flex: 1 },
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
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#2f6fed",
  },
  addBtnPressed: { opacity: 0.85 },
  addBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  syncBar: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: "#1c2942",
  },
  syncText: { color: "#bdf99b", fontSize: 12 },
  mapWrap: {
    flex: 1,
  },
});
