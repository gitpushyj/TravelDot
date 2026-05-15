import { Dimensions, StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export const GRID_COLS = 3;
export const GRID_GAP = 4;
const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_PADDING = 16;
export const GRID_CELL =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

export function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 56,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    iconBtnPressed: { backgroundColor: theme.tabRowBg },
    iconBtnText: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "600",
      lineHeight: 24,
    },
    headerCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
      gap: 6,
    },
    headerFlag: { fontSize: 18 },
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    headerCode: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },
    editBtn: {
      paddingHorizontal: 12,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    editBtnPressed: { backgroundColor: theme.tabRowBg },
    editBtnText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 60,
      gap: 20,
    },
    heroCard: {
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: theme.accent,
      // 그라데이션 대신 단색 + 카드 위 도트 배치로 충분히 임팩트가 있다.
      aspectRatio: 16 / 11,
    },
    heroDots: {
      // 도트는 카드 가장자리까지 닿고, 아래 칩 영역만 분리된다.
      // padding을 자식(칩)으로 옮겨서 도트맵 measurement에 음수 margin이
      // 끼지 않도록 한다.
      flex: 1,
    },
    heroBadgeRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 8,
    },
    heroBadge: {
      flexDirection: "row",
      alignItems: "baseline",
      backgroundColor: "rgba(255,255,255,0.95)",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
    },
    heroBadgeNum: {
      color: "#1a1a1a",
      fontSize: 17,
      fontWeight: "800",
    },
    heroBadgeUnit: {
      color: "#1a1a1a",
      fontSize: 13,
      fontWeight: "600",
    },
    section: {
      gap: 6,
    },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    sectionDate: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: "800",
    },
    allLink: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: "700",
    },
    photoRow: {
      gap: 12,
      paddingRight: 4,
    },
    photoCard: {
      width: 160,
      aspectRatio: 16 / 22,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: theme.cardBg,
    },
    photoImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    photoIndex: {
      position: "absolute",
      top: 10,
      left: 10,
      backgroundColor: "rgba(0,0,0,0.55)",
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    photoIndexText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "800",
    },
    photoCaption: {
      position: "absolute",
      left: 12,
      bottom: 12,
    },
    photoCaptionText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
      textShadowColor: "rgba(0,0,0,0.45)",
      textShadowRadius: 4,
    },
    emptyPhotos: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      backgroundColor: theme.cardBg,
      paddingVertical: 28,
      alignItems: "center",
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 13,
    },
    gridContent: {
      paddingHorizontal: GRID_PADDING,
      paddingTop: 4,
      paddingBottom: 40,
    },
    gridRow: {
      gap: GRID_GAP,
      marginBottom: GRID_GAP,
    },
    gridCell: {
      width: GRID_CELL,
      height: GRID_CELL,
      borderRadius: 6,
      overflow: "hidden",
      backgroundColor: theme.cardBg,
    },
    gridImage: {
      width: "100%",
      height: "100%",
    },
    gridEmpty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    noteCard: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 18,
      gap: 12,
    },
    noteHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    noteTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    noteDate: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    noteBody: {
      color: theme.textPrimary,
      fontSize: 14,
      lineHeight: 22,
    },
  });
}

export type TripDetailStyles = ReturnType<typeof makeStyles>;
