import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { MedalConfig } from "../../../features/badges/badgeVisuals";
import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";
import BadgeMedal from "../../TitlesScreen/BadgeMedal";
import SlideFrame from "./SlideFrame";

// 호칭·마일스톤 소개 슬라이드. 실제 BadgeMedal을 하드코딩한 MedalConfig로 재사용한다.
type DemoBadge = { config: MedalConfig; labelKey: string };

const DEMO_BADGES: readonly DemoBadge[] = [
  { config: { stage: "gold", content: { kind: "emoji", emoji: "🥇" } }, labelKey: "premiumIntro.slides.titles.b1" },
  { config: { stage: "silver", content: { kind: "emoji", emoji: "✈️" } }, labelKey: "premiumIntro.slides.titles.b2" },
  { config: { stage: "bronze", content: { kind: "emoji", emoji: "🗺️" } }, labelKey: "premiumIntro.slides.titles.b3" },
  { config: { stage: "p2", content: { kind: "emoji", emoji: "🌏" } }, labelKey: "premiumIntro.slides.titles.b4" },
  { config: { stage: "silver", content: { kind: "emoji", emoji: "🏔️" } }, labelKey: "premiumIntro.slides.titles.b5" },
  { config: { stage: "gold", content: { kind: "emoji", emoji: "🎖️" } }, labelKey: "premiumIntro.slides.titles.b6" },
];

export default function TitlesSlide() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <SlideFrame
      icon="🏅"
      iconBg="#e0e3ff"
      title={t("premiumIntro.slides.titles.title")}
      desc={t("premiumIntro.slides.titles.desc")}
    >
      <View style={styles.grid}>
        {DEMO_BADGES.map((b) => (
          <View key={b.labelKey} style={styles.cell}>
            <BadgeMedal config={b.config} size={44} />
            <Text style={styles.label} numberOfLines={1}>
              {t(b.labelKey)}
            </Text>
          </View>
        ))}
      </View>
    </SlideFrame>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      rowGap: 16,
    },
    cell: {
      width: "33.33%",
      alignItems: "center",
      gap: 6,
    },
    label: {
      color: theme.textPrimary,
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
    },
  });
}
