import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { BadgeStage, MedalConfig } from "../../../features/badges/badgeVisuals";
import { PREMIUM_BADGE_DEFS_BY_ID } from "../../../features/milestone/premium/premiumBadgeCatalog";
import { getCurrentLocale } from "../../../i18n";
import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";
import BadgeMedal from "../../TitlesScreen/BadgeMedal";
import SlideFrame from "./SlideFrame";

// 호칭·마일스톤 소개 슬라이드. 실제 유료 호칭 카탈로그(PREMIUM_BADGE_DEFS_BY_ID)에서
// 대표 12개를 골라 실제 BadgeMedal 컴포넌트로 보여준다.
const SHOWCASE: readonly { id: string; stage: BadgeStage }[] = [
  { id: "premium_calendar_6", stage: "silver" },
  { id: "premium_calendar_12", stage: "gold" },
  { id: "premium_flag_palette_5", stage: "p1" },
  { id: "premium_flag_palette_7", stage: "p2" },
  { id: "premium_un_linguist_3", stage: "p1" },
  { id: "premium_un_linguist_6", stage: "p3" },
  { id: "premium_humanity_25", stage: "p1" },
  { id: "premium_humanity_50", stage: "p2" },
  { id: "premium_humanity_75", stage: "p3" },
  { id: "premium_earth_25", stage: "p1" },
  { id: "premium_earth_75", stage: "p3" },
  { id: "premium_round_the_clock", stage: "gold" },
];

export default function TitlesSlide() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isKo = getCurrentLocale() === "ko";

  return (
    <SlideFrame
      icon="🏅"
      iconBg="#e0e3ff"
      title={t("premiumIntro.slides.titles.title")}
      desc={t("premiumIntro.slides.titles.desc")}
    >
      <View style={styles.grid}>
        {SHOWCASE.map(({ id, stage }) => {
          const badge = PREMIUM_BADGE_DEFS_BY_ID[id];
          const config: MedalConfig = {
            stage,
            content: { kind: "emoji", emoji: badge.emoji },
          };
          return (
            <View key={id} style={styles.cell}>
              <BadgeMedal config={config} size={44} />
              <Text style={styles.label} numberOfLines={2}>
                {isKo ? badge.titleKo : badge.titleEn}
              </Text>
            </View>
          );
        })}
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
      paddingHorizontal: 4,
    },
    label: {
      color: theme.textPrimary,
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
      lineHeight: 14,
    },
  });
}
