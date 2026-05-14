import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 56,
    },
    center: { alignItems: "center", justifyContent: "center" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
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
      fontSize: 16,
      fontWeight: "800",
    },
    cancel: {
      color: theme.textSecondary,
      fontSize: 15,
      fontWeight: "600",
      minWidth: 44,
    },
    confirm: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: "800",
      minWidth: 44,
      textAlign: "right",
    },
    confirmDisabled: {
      color: theme.textMuted,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 60,
      gap: 24,
    },
    section: { gap: 10 },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
    },
    dateSeparator: {
      color: theme.textMuted,
      fontSize: 18,
      paddingBottom: 12,
    },
    helpText: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    errorText: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "600",
    },
    noteInput: {
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.textPrimary,
      fontSize: 14,
      lineHeight: 22,
      minHeight: 120,
    },
    addBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    addBtnPressed: { backgroundColor: theme.tabRowBg },
    addBtnText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
    photoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    photoCell: {
      width: 96,
      height: 96,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: theme.cardBg,
    },
    photoImage: { width: "100%", height: "100%" },
    photoRemoveBtn: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "rgba(0,0,0,0.78)",
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.92)",
      alignItems: "center",
      justifyContent: "center",
    },
    photoRemoveText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "800",
      lineHeight: 20,
    },
    photoBadge: {
      position: "absolute",
      bottom: 4,
      left: 4,
      backgroundColor: theme.accent,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    photoBadgeText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    photoEmpty: {
      paddingVertical: 16,
      alignItems: "center",
    },
    undoBtn: {
      alignSelf: "flex-start",
      marginTop: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.tabRowBg,
    },
    undoBtnPressed: { opacity: 0.7 },
    undoBtnText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}

export type EditTripStyles = ReturnType<typeof makeStyles>;
