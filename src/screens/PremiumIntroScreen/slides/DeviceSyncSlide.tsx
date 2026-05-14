import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { CloudUpload } from "lucide-react-native";

import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";
import SlideFrame from "./SlideFrame";

// 기기 동기화 소개 슬라이드. 두 기기 카드 + 동기화 화살표를 양식화된 목업으로 그린다.
function DeviceCard({
  label,
  styles,
}: {
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.device}>
      <Text style={styles.deviceLabel}>{label}</Text>
      <View style={styles.deviceScreen}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={styles.deviceDot} />
        ))}
      </View>
    </View>
  );
}

export default function DeviceSyncSlide() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <SlideFrame
      icon="☁️"
      iconBg={theme.accentSoftBg}
      title={t("premiumIntro.slides.deviceSync.title")}
      desc={t("premiumIntro.slides.deviceSync.desc")}
    >
      <View style={styles.wrap}>
        <View style={styles.devicesRow}>
          <DeviceCard label={t("premiumIntro.slides.deviceSync.devicePhone")} styles={styles} />
          <Text style={styles.arrow}>⇄</Text>
          <DeviceCard label={t("premiumIntro.slides.deviceSync.deviceTablet")} styles={styles} />
        </View>
        <View style={styles.noteRow}>
          <CloudUpload size={14} color={theme.textSecondary} strokeWidth={2.2} />
          <Text style={styles.note}>{t("premiumIntro.slides.deviceSync.note")}</Text>
        </View>
      </View>
    </SlideFrame>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    wrap: { gap: 16 },
    devicesRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    device: {
      flex: 1,
      backgroundColor: theme.homeBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 10,
      alignItems: "center",
      gap: 8,
    },
    deviceLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    deviceScreen: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      justifyContent: "center",
    },
    deviceDot: {
      width: 14,
      height: 14,
      borderRadius: 3,
      backgroundColor: theme.accent,
      opacity: 0.85,
    },
    arrow: {
      color: theme.accent,
      fontSize: 22,
      fontWeight: "700",
    },
    noteRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    note: {
      color: theme.textSecondary,
      fontSize: 12,
    },
  });
}
