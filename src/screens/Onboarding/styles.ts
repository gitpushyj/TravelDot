import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export function makeOnboardingStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
    },
    progressWrap: {
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 8,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.tabRowBg,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: theme.accent,
    },
    body: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    bodyHeader: {
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: "800",
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 36,
    },
    primaryBtn: {
      backgroundColor: theme.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
    },
    primaryBtnPressed: { opacity: 0.85 },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
    },
    hintBox: {
      backgroundColor: theme.accentSoftBg,
      borderRadius: 12,
      padding: 14,
      marginTop: 20,
    },
    hintBoxText: {
      color: theme.accentSoftText,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600",
    },
    centerWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      gap: 14,
    },
    centerTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
      marginTop: 8,
      textAlign: "center",
    },
    centerBody: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
    },
    smallNote: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 17,
      textAlign: "center",
      marginTop: 12,
    },
    inlineNote: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 12,
    },
  });
}
