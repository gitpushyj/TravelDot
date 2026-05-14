import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { CloudUpload } from "lucide-react-native";

import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";
import MiniDotMap from "./MiniDotMap";
import SlideFrame from "./SlideFrame";

// 기기 동기화 소개 슬라이드. 가운데 "내 기기"를 두고 위(A, B) / 아래(C, D)에
// 다른 기기 4개를 배치해, 같은 여행 지도가 여러 기기 사이에서 동기화됨을 보여준다.
function DeviceCard({
  label,
  styles,
  mapColor,
  emphasized,
}: {
  label: string;
  styles: ReturnType<typeof makeStyles>;
  mapColor: string;
  emphasized?: boolean;
}) {
  const [mapWidth, setMapWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== mapWidth) setMapWidth(w);
  };

  return (
    <View style={[styles.device, emphasized && styles.deviceEmphasized]}>
      <Text style={[styles.deviceLabel, emphasized && styles.deviceLabelEmphasized]}>
        {label}
      </Text>
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
            label={t("premiumIntro.slides.deviceSync.deviceA")}
            styles={styles}
            mapColor={theme.accent}
          />
          <DeviceCard
            label={t("premiumIntro.slides.deviceSync.deviceB")}
            styles={styles}
            mapColor={theme.accent}
          />
        </View>
        <Text style={styles.arrows}>⇅      ⇅</Text>
        <View style={styles.centerWrap}>
          <View style={styles.centerSlot}>
            <DeviceCard
              label={t("premiumIntro.slides.deviceSync.myDevice")}
              styles={styles}
              mapColor={theme.accent}
              emphasized
            />
          </View>
        </View>
        <Text style={styles.arrows}>⇅      ⇅</Text>
        <View style={styles.devicesRow}>
          <DeviceCard
            label={t("premiumIntro.slides.deviceSync.deviceC")}
            styles={styles}
            mapColor={theme.accent}
          />
          <DeviceCard
            label={t("premiumIntro.slides.deviceSync.deviceD")}
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
    wrap: { gap: 4 },
    devicesRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 10,
    },
    centerWrap: {
      // 중앙 카드 슬롯을 가로로 가운데 정렬하기 위한 래퍼.
      flexDirection: "row",
      justifyContent: "center",
    },
    centerSlot: {
      // flexDirection: row를 명시해야 DeviceCard의 flex:1이 가로 폭을 채운다.
      // (column 방향 컨텍스트에서 flex:1은 높이 0으로 무너져 카드가 알약처럼 보이는 버그가 있었음.)
      flexDirection: "row",
      width: "55%",
    },
    device: {
      flex: 1,
      backgroundColor: theme.homeBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 8,
      paddingTop: 6,
      paddingBottom: 8,
      gap: 6,
    },
    deviceEmphasized: {
      borderColor: theme.accent,
      borderWidth: 1.5,
      backgroundColor: theme.accentSoftBg,
    },
    deviceLabel: {
      color: theme.textSecondary,
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
    },
    deviceLabelEmphasized: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "800",
    },
    deviceScreen: {
      width: "100%",
    },
    arrows: {
      color: theme.accent,
      fontSize: 16,
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 20,
      letterSpacing: 2,
    },
    noteRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 8,
    },
    note: {
      color: theme.textSecondary,
      fontSize: 12,
    },
  });
}
