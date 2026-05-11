import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";
import type { Theme } from "../../theme/theme";

import FlightDetailSheet from "./FlightDetailSheet";
import FlightInputModal from "./FlightInputModal";
import { useFlightStore } from "./flightStore";
import { formatRemainingShort } from "./timeUtils";

// MapActions 행 안에 들어가는 ✈️ 버튼.
// idle: 정사각형 아이콘 버튼 (다른 액션 버튼과 같은 크기)
// live: 폭이 늘어나는 chip — IATA → IATA · 남은 시간 표시.
//   탭하면 디테일 시트가 열린다.
export default function FlightButton() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const active = useFlightStore((s) => s.active);

  const [inputOpen, setInputOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // 1분 단위로 라이브 chip 텍스트 재계산. 진행률 자체는 worklet으로 매 프레임 흐르지만
  // 텍스트 라벨은 분 단위 갱신으로 충분.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [active]);

  const remainingLabel = useMemo(() => {
    if (!active) return "";
    void tick;
    const remainingMs = Math.max(0, active.arriveAt - Date.now());
    return formatRemainingShort(remainingMs);
  }, [active, tick]);

  if (active) {
    return (
      <>
        <Pressable
          onPress={() => setDetailOpen(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("flight.liveA11y")}
          style={({ pressed }) => [
            styles.liveChip,
            pressed && styles.liveChipPressed,
          ]}
        >
          <Text style={styles.planeIcon}>✈</Text>
          <Text style={styles.liveText}>
            {active.origin.iata}
            <Text style={styles.liveArrow}> → </Text>
            {active.destination.iata}
          </Text>
          <View style={styles.dot} />
          <Text style={styles.liveSub}>
            {t("flight.remainingShort", { value: remainingLabel })}
          </Text>
        </Pressable>
        <FlightDetailSheet
          visible={detailOpen}
          onClose={() => setDetailOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => setInputOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t("flight.startA11y")}
        style={({ pressed }) => [
          styles.iconBtn,
          pressed && styles.iconBtnPressed,
        ]}
      >
        <Text style={styles.iconText}>✈</Text>
      </Pressable>
      <FlightInputModal
        visible={inputOpen}
        onClose={() => setInputOpen(false)}
      />
    </>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    // idle 상태 — MapActions 다른 버튼과 동일한 32×32 원형. 그림자도 같이 맞춘다.
    iconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    iconBtnPressed: { backgroundColor: theme.optionBtnPressedBg },
    iconText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    // live 상태 — 가로로 길어지는 chip. 다른 버튼과 같은 높이(32)로 통일.
    liveChip: {
      flexDirection: "row",
      alignItems: "center",
      height: 32,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 6,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    liveChipPressed: { opacity: 0.85 },
    planeIcon: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    liveText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
    },
    liveArrow: { color: theme.textSecondary, fontWeight: "500" },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: theme.textSecondary,
      marginHorizontal: 2,
    },
    liveSub: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
