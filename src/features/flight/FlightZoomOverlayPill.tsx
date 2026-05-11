import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useFlightStore } from "./flightStore";
import { formatRemainingShort } from "./timeUtils";

// MapZoomScreen 화면 하단에 떠 있는 반투명 비행 정보 pill.
// 회전된 컨테이너의 bottomOverlay 자리에 mount된다 (포지셔닝은 호출자 책임).
// 비행이 없으면 null을 반환해 영역을 차지하지 않는다.
export default function FlightZoomOverlayPill() {
  const active = useFlightStore((s) => s.active);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [active]);

  const remaining = useMemo(() => {
    if (!active) return "";
    void tick;
    return formatRemainingShort(Math.max(0, active.arriveAt - Date.now()));
  }, [active, tick]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.pill}>
      <Text style={styles.icon}>✈</Text>
      <Text style={styles.text}>
        {active.origin.iata}
        <Text style={styles.arrow}> → </Text>
        {active.destination.iata}
      </Text>
      <View style={styles.dot} />
      <Text style={styles.sub}>{remaining}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 999,
    maxWidth: "80%",
  },
  icon: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginRight: 8,
  },
  text: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  arrow: { color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 8,
  },
  sub: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" },
});
