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
    rowDescriptionBold: {
      color: theme.textPrimary,
      fontWeight: "700",
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
    premiumSection: {
      marginTop: 24,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 12,
      padding: 12,
      gap: 8,
      backgroundColor: theme.cardBg,
    },
    premiumHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    premiumLock: { fontSize: 16 },
    premiumTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    premiumCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 8,
      paddingHorizontal: 4,
      opacity: 0.85,
    },
    premiumIcon: { fontSize: 22 },
    premiumTextCol: { flex: 1 },
    premiumName: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    premiumDescription: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    premiumCardLock: { fontSize: 14, opacity: 0.6 },
    premiumCta: {
      marginTop: 8,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: theme.accent,
      borderRadius: 8,
    },
    premiumCtaText: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
  });
}
