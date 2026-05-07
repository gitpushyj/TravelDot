import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

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
    headerSide: { minWidth: 40 },
    title: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
    cancel: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: "600",
    },
    quickLink: {
      color: theme.accent,
      fontSize: 14,
      fontWeight: "600",
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 40,
    },
    autoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 20,
    },
    autoLabel: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    autoSub: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
      lineHeight: 16,
    },
    autoBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.tabRowBg,
    },
    autoBtnActive: {
      backgroundColor: theme.accent,
    },
    autoBtnText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
    autoBtnTextActive: {
      color: theme.radioCheckColor,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    sectionLabel: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    sectionCount: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    card: {
      width: "48.5%",
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 12,
      minHeight: 120,
      gap: 4,
      position: "relative",
    },
    cardLocked: {
      backgroundColor: theme.tabRowBg,
      borderColor: theme.cardBorder,
      opacity: 0.55,
    },
    cardActive: {
      borderColor: theme.accent,
      borderWidth: 2,
      backgroundColor: theme.selectedRowBg,
    },
    cardEmoji: {
      fontSize: 24,
      marginBottom: 2,
    },
    cardEmojiLocked: {
      opacity: 0.6,
    },
    cardTitle: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 17,
    },
    cardTitleLocked: {
      color: theme.textMuted,
    },
    cardDesc: {
      color: theme.textSecondary,
      fontSize: 11,
      lineHeight: 15,
    },
    cardDescLocked: {
      color: theme.textMuted,
    },
    activeMark: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    activeMarkText: {
      color: theme.radioCheckColor,
      fontSize: 13,
      fontWeight: "900",
      marginTop: -1,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 12,
      paddingHorizontal: 4,
      paddingVertical: 8,
      lineHeight: 17,
    },
  });
}
