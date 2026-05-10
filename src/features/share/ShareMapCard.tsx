import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import DotMap from "../../components/DotMap";
import type { SharePalette } from "./sharePalette";

// 공유용 이미지는 항상 1080×1920(9:16, 인스타 스토리 권장)로 layout한다.
// 화면 표시는 부모가 transform: scale 로 축소하고, 캡처는 view-shot이
// view의 unscaled bounds 기준으로 렌더하므로 본래 해상도 그대로 PNG가 나온다.
export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1920;

// DotMap의 자연 비율(viewBoxW:viewBoxH = 360:145).
const MAP_NATURAL_RATIO = 360 / 145;

// 외곽 frame과 안쪽 card 사이 여백. card가 frame 위에 떠 있는 카드처럼 보이도록 한다.
const FRAME_PADDING_X = 60;
const FRAME_PADDING_Y = 80;
const CARD_RADIUS = 56;

const HORIZONTAL_PADDING = 30;
const INNER_CARD_WIDTH = SHARE_CARD_WIDTH - FRAME_PADDING_X * 2;
const MAP_SLOT_WIDTH = INNER_CARD_WIDTH - HORIZONTAL_PADDING * 2;
const MAP_SLOT_HEIGHT = Math.round(MAP_SLOT_WIDTH / MAP_NATURAL_RATIO);

type Props = {
  palette: SharePalette;
  visitCounts: Record<string, number>;
  badgeEmoji: string | null;
  badgeTitle: string | null;
  countries: number;
  days: number;
  yearLabel: string;
  countriesUnit: string;
  daysUnit: string;
  // true이면 사용자가 미리보기 안에서 지도를 핀치/팬으로 줌·이동할 수 있다.
  // 캡처 시 view-shot이 DotMap 내부 transform을 그대로 픽셀로 굽는다.
  enableMapZoom?: boolean;
};

const ShareMapCard = forwardRef<View, Props>(function ShareMapCard(
  {
    palette,
    visitCounts,
    badgeEmoji,
    badgeTitle,
    countries,
    days,
    yearLabel,
    countriesUnit,
    daysUnit,
    enableMapZoom = false,
  },
  ref
) {
  const styles = makeStyles(palette);
  return (
    <View ref={ref} collapsable={false} style={styles.frame}>
      <View style={styles.card}>
        {/* 호칭 */}
        <View style={styles.titleSection}>
          {badgeTitle ? (
            <View style={styles.badgeChip}>
              <Text style={styles.badgeText}>
                {badgeEmoji ? `${badgeEmoji} ` : ""}
                {badgeTitle}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 지도 */}
        <View style={styles.mapSlot}>
          <DotMap
            visitCounts={visitCounts}
            enableZoom={enableMapZoom}
            playIntro={false}
            mapAreaStyle={styles.mapInner}
          />
        </View>

        {/* 통계 */}
        <View style={styles.statsSection}>
          <View style={styles.statRow}>
            <Text style={styles.statNum}>{countries}</Text>
            <Text style={styles.statUnit}> {countriesUnit}</Text>
            <Text style={styles.statDot}> · </Text>
            <Text style={styles.statNum}>{days}</Text>
            <Text style={styles.statUnit}> {daysUnit}</Text>
          </View>
        </View>

        {/* 날짜 */}
        <View style={styles.yearSection}>
          {yearLabel ? <Text style={styles.yearLabel}>{yearLabel}</Text> : null}
        </View>

        {/* 워터마크는 카드 맨 아래에 붙는다. */}
        <View style={styles.footer}>
          <Text style={styles.watermark}>· PixelTravel ·</Text>
        </View>
      </View>
    </View>
  );
});

export default ShareMapCard;

function makeStyles(palette: SharePalette) {
  return StyleSheet.create({
    frame: {
      width: SHARE_CARD_WIDTH,
      height: SHARE_CARD_HEIGHT,
      backgroundColor: palette.frameBg,
      paddingHorizontal: FRAME_PADDING_X,
      paddingVertical: FRAME_PADDING_Y,
    },
    card: {
      flex: 1,
      width: "100%",
      backgroundColor: palette.bg,
      borderRadius: CARD_RADIUS,
      paddingTop: 180,
      paddingBottom: 60,
      paddingHorizontal: HORIZONTAL_PADDING,
      alignItems: "center",
      overflow: "hidden",
    },
    titleSection: {
      alignItems: "center",
      marginBottom: 110,
    },
    badgeChip: {
      backgroundColor: palette.badgeBg,
      paddingHorizontal: 44,
      paddingVertical: 22,
      borderRadius: 28,
    },
    badgeText: {
      color: palette.badgeText,
      fontSize: 72,
      fontWeight: "800",
    },
    mapSlot: {
      width: MAP_SLOT_WIDTH,
      height: MAP_SLOT_HEIGHT,
      overflow: "hidden",
    },
    mapInner: {
      flex: 1,
      width: "100%",
      aspectRatio: undefined,
    },
    statsSection: {
      marginTop: 90,
      alignItems: "center",
    },
    statRow: {
      flexDirection: "row",
      alignItems: "baseline",
    },
    statNum: {
      color: palette.textPrimary,
      fontSize: 132,
      fontWeight: "900",
    },
    statUnit: {
      color: palette.textPrimary,
      fontSize: 60,
      fontWeight: "700",
    },
    statDot: {
      color: palette.textMuted,
      fontSize: 80,
      fontWeight: "700",
    },
    yearSection: {
      marginTop: 28,
      alignItems: "center",
    },
    yearLabel: {
      color: palette.textSecondary,
      fontSize: 56,
      fontWeight: "600",
      letterSpacing: 2,
    },
    footer: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
    },
    watermark: {
      color: palette.textSecondary,
      fontSize: 42,
      fontWeight: "700",
      letterSpacing: 6,
    },
  });
}
