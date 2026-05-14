import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { CloudUpload } from "lucide-react-native";

import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";
import MiniDotMap from "./MiniDotMap";
import SlideFrame from "./SlideFrame";

// 기기 동기화 소개 슬라이드. 두 기기 카드 각각에 실제 dot 좌표로 만든
// 미니 월드맵을 띄워, 같은 여행 지도가 기기 간 공유됨을 보여준다.
function DeviceCard({
  label,
  styles,
  mapColor,
}: {
  label: string;
  styles: ReturnType<typeof makeStyles>;
  mapColor: string;
}) {
  const [mapWidth, setMapWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== mapWidth) setMapWidth(w);
  };

  return (
    <View style={styles.device}>
      <Text style={styles.deviceLabel}>{label}</Text>
      <View style={styles.deviceScreen} onLayout={onLayout}>
        {mapWidth > 0 ? <MiniDotMap width={mapWidth} soloColor={mapColor} /> : null}
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
          <DeviceCard
            label={t("premiumIntro.slides.deviceSync.devicePhone")}
            styles={styles}
            mapColor={theme.accent}
          />
          <Text style={styles.arrow}>⇄</Text>
          <DeviceCard
            label={t("premiumIntro.slides.deviceSync.deviceTablet")}
            styles={styles}
            mapColor={theme.accent}
          />
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
    wrap: { gap: 18 },
    devicesRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    device: {
      flex: 1,
      backgroundColor: theme.homeBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 12,
      gap: 8,
    },
    deviceLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },
    deviceScreen: {
      width: "100%",
    },
    arrow: {
      color: theme.accent,
      fontSize: 20,
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
