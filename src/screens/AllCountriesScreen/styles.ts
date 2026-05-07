import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export const NUM_COLUMNS = 4;
export const LIST_PADDING_H = 12;
export const CELL_GAP = 8;

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
    iconBtnPlaceholder: { width: 40, height: 40 },
    iconBtnText: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "600",
      lineHeight: 24,
    },
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 8,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.tabRowBg,
    },
    filterChipPressed: { opacity: 0.7 },
    filterChipActive: {
      backgroundColor: theme.accent,
    },
    filterChipText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "700",
    },
    filterChipTextActive: {
      color: "#ffffff",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    metaText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    metaTextMuted: {
      color: theme.textSecondary,
      fontWeight: "600",
    },
    sortPills: {
      flexDirection: "row",
      backgroundColor: theme.tabRowBg,
      borderRadius: 999,
      padding: 3,
      gap: 2,
    },
    sortChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    sortChipActive: {
      backgroundColor: theme.cardBg,
    },
    sortChipText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },
    sortChipTextActive: {
      color: theme.textPrimary,
    },
    listContent: {
      paddingHorizontal: LIST_PADDING_H,
      paddingTop: 8,
      paddingBottom: 60,
    },
    gridRow: {
      gap: CELL_GAP,
      justifyContent: "flex-start",
    },
    cell: {
      aspectRatio: 0.85,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 14,
      paddingHorizontal: 6,
      paddingVertical: 10,
      marginBottom: CELL_GAP,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      position: "relative",
    },
    cellPressed: {
      backgroundColor: theme.rowPressedBg,
    },
    flag: {
      fontSize: 34,
    },
    flagDim: {
      opacity: 0.35,
    },
    cellName: {
      color: theme.textPrimary,
      fontSize: 11,
      fontWeight: "700",
      textAlign: "center",
    },
    cellNameDim: {
      color: theme.textMuted,
      fontWeight: "600",
    },
    homeBadge: {
      position: "absolute",
      top: 6,
      right: 6,
      backgroundColor: theme.accent,
      borderRadius: 999,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    homeBadgeText: {
      color: "#ffffff",
      fontSize: 9,
      fontWeight: "800",
    },
    emptyWrap: {
      paddingHorizontal: 20,
      paddingVertical: 36,
      alignItems: "center",
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 13,
      textAlign: "center",
    },
  });
}
