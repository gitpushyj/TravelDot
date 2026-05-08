import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import DotMap from "../../components/DotMap";
import type { Theme } from "../../theme/theme";

// 공유용 카드는 항상 1080×1920(9:16, 인스타 스토리 권장)로 layout한다.
// 화면 표시는 부모가 transform: scale 로 축소하고, 캡처는 view-shot이
// view의 unscaled bounds 기준으로 렌더하므로 본래 해상도 그대로 PNG가 나온다.
export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1920;

// DotMap의 자연 비율(viewBoxW:viewBoxH = 360:145).
const MAP_NATURAL_RATIO = 360 / 145;

const MAP_HORIZONTAL_PADDING = 60;
const MAP_SLOT_WIDTH = SHARE_CARD_WIDTH - MAP_HORIZONTAL_PADDING * 2;
const MAP_SLOT_HEIGHT = Math.round(MAP_SLOT_WIDTH / MAP_NATURAL_RATIO);

type Props = {
  theme: Theme;
  visitCounts: Record<string, number>;
  badgeEmoji: string | null;
  badgeTitle: string | null;
  countries: number;
  days: number;
  yearLabel: string;
  countriesUnit: string;
  daysUnit: string;
};

const ShareMapCard = forwardRef<View, Props>(function ShareMapCard(
  {
    theme,
    visitCounts,
    badgeEmoji,
    badgeTitle,
    countries,
    days,
    yearLabel,
    countriesUnit,
    daysUnit,
  },
  ref
) {
  const styles = makeStyles(theme);
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={styles.header}>
        {badgeTitle ? (
          <View style={styles.badgeChip}>
            <Text style={styles.badgeText}>
              {badgeEmoji ? `${badgeEmoji} ` : ""}
              {badgeTitle}
            </Text>
          </View>
        ) : null}
        <View style={styles.statRow}>
          <Text style={styles.statNum}>{countries}</Text>
          <Text style={styles.statUnit}> {countriesUnit}</Text>
          <Text style={styles.statDot}> · </Text>
          <Text style={styles.statNum}>{days}</Text>
          <Text style={styles.statUnit}> {daysUnit}</Text>
        </View>
        {yearLabel ? <Text style={styles.yearLabel}>{yearLabel}</Text> : null}
      </View>

      <View style={styles.mapSlot}>
        <DotMap
          visitCounts={visitCounts}
          enableZoom={false}
          playIntro={false}
          mapAreaStyle={styles.mapInner}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.watermark}>· TravelDot ·</Text>
      </View>
    </View>
  );
});

export default ShareMapCard;

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      width: SHARE_CARD_WIDTH,
      height: SHARE_CARD_HEIGHT,
      backgroundColor: theme.homeBg,
      paddingTop: 200,
      paddingBottom: 120,
      paddingHorizontal: MAP_HORIZONTAL_PADDING,
      alignItems: "center",
      justifyContent: "flex-start",
    },
    header: {
      alignItems: "center",
      gap: 32,
    },
    badgeChip: {
      backgroundColor: theme.accentSoftBg,
      paddingHorizontal: 36,
      paddingVertical: 18,
      borderRadius: 24,
    },
    badgeText: {
      color: theme.accentSoftText,
      fontSize: 56,
      fontWeight: "800",
    },
    statRow: {
      flexDirection: "row",
      alignItems: "baseline",
    },
    statNum: {
      color: theme.textPrimary,
      fontSize: 96,
      fontWeight: "900",
    },
    statUnit: {
      color: theme.textPrimary,
      fontSize: 44,
      fontWeight: "700",
    },
    statDot: {
      color: theme.textMuted,
      fontSize: 56,
      fontWeight: "700",
    },
    yearLabel: {
      color: theme.textSecondary,
      fontSize: 40,
      fontWeight: "600",
      letterSpacing: 1,
    },
    mapSlot: {
      width: MAP_SLOT_WIDTH,
      height: MAP_SLOT_HEIGHT,
      marginTop: 80,
    },
    mapInner: {
      flex: 1,
      width: "100%",
      aspectRatio: undefined,
    },
    footer: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
    },
    watermark: {
      color: theme.textSecondary,
      fontSize: 36,
      fontWeight: "700",
      letterSpacing: 4,
    },
  });
}
