import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";
import type { Theme } from "../../theme/theme";

import { useFlightStore } from "./flightStore";
import {
  formatHm,
  formatRemainingShort,
} from "./timeUtils";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function FlightDetailSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const active = useFlightStore((s) => s.active);
  const cancel = useFlightStore((s) => s.cancel);

  // 1초마다 남은 시간 갱신.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [visible]);

  if (!active) return null;

  const total = Math.max(1, active.arriveAt - active.departAt);
  const elapsed = Math.max(0, now - active.departAt);
  const progress = Math.max(0, Math.min(1, elapsed / total));
  const remainingMs = Math.max(0, active.arriveAt - now);

  const onPressCancel = () => {
    Alert.alert(
      t("flight.cancelConfirmTitle"),
      t("flight.cancelConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("flight.cancelConfirmAction"),
          style: "destructive",
          onPress: async () => {
            await cancel();
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>
      <View style={styles.sheetWrap}>
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{t("flight.detailTitle")}</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.route}>
            <View style={styles.routeBlock}>
              <Text style={styles.routeIata}>{active.origin.iata}</Text>
              <Text style={styles.routeCity} numberOfLines={1}>
                {active.origin.city}
              </Text>
            </View>
            <Text style={styles.routeArrow}>→</Text>
            <View style={styles.routeBlock}>
              <Text style={styles.routeIata}>{active.destination.iata}</Text>
              <Text style={styles.routeCity} numberOfLines={1}>
                {active.destination.city}
              </Text>
            </View>
          </View>

          <View style={styles.timesRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>{t("flight.departTime")}</Text>
              <Text style={styles.timeValue}>{formatHm(active.departAt)}</Text>
            </View>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>{t("flight.arriveTime")}</Text>
              <Text style={styles.timeValue}>{formatHm(active.arriveAt)}</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {t("flight.remaining", { value: formatRemainingShort(remainingMs) })}
            {"  ·  "}
            {Math.round(progress * 100)}%
          </Text>

          <Pressable
            onPress={onPressCancel}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && styles.cancelBtnPressed,
            ]}
          >
            <Text style={styles.cancelBtnText}>{t("flight.cancelBtn")}</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheetWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheet: {
      backgroundColor: theme.cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.cardBorder,
      marginBottom: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    title: { color: theme.textPrimary, fontSize: 17, fontWeight: "700" },
    closeBtn: { padding: 4 },
    closeIcon: { color: theme.textSecondary, fontSize: 16, fontWeight: "700" },
    route: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: theme.optionBtnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.cardBorder,
    },
    routeBlock: { flex: 1, alignItems: "center" },
    routeIata: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: 1.5,
    },
    routeCity: {
      color: theme.textSecondary,
      fontSize: 13,
      marginTop: 4,
      maxWidth: 120,
    },
    routeArrow: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: "700",
      marginHorizontal: 8,
    },
    timesRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    timeBlock: { flex: 1 },
    timeLabel: { color: theme.textSecondary, fontSize: 12, fontWeight: "600" },
    timeValue: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      marginTop: 4,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      marginTop: 20,
      backgroundColor: theme.optionBtnPressedBg,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.textPrimary,
    },
    progressLabel: {
      marginTop: 8,
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
    },
    cancelBtn: {
      marginTop: 20,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.optionBtnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.cardBorder,
      alignItems: "center",
    },
    cancelBtnPressed: { backgroundColor: theme.optionBtnPressedBg },
    cancelBtnText: { color: theme.textPrimary, fontSize: 15, fontWeight: "700" },
  });
}
