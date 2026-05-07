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
    row: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 10,
    },
    rowActive: {
      borderColor: theme.accent,
      borderWidth: 2,
      backgroundColor: theme.selectedRowBg,
    },
    rowTopLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    rowDescription: {
      marginTop: 10,
      paddingLeft: 34,
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    rowDescriptionDone: {
      color: theme.accent,
      fontWeight: "600",
    },
    footnote: {
      marginTop: 16,
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    radioActive: {
      borderColor: theme.accent,
      backgroundColor: theme.accent,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.radioCheckColor,
    },
    rowMain: { flex: 1 },
    rowLabel: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    rowProgress: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    rowProgressDone: {
      color: theme.accent,
    },
  });
}
