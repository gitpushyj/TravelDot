import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 48,
      paddingBottom: 0,
    },
    closeBtn: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    closeIcon: {
      color: theme.textMuted,
      fontSize: 22,
      fontWeight: "300",
    },
    scroll: {
      flexGrow: 1,
    },
    contentWrap: {
      paddingHorizontal: 24,
      paddingTop: 4,
      paddingBottom: 8,
    },
    heading: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: "800",
      textAlign: "center",
      marginTop: 4,
    },
    headingAccent: {
      color: theme.accent,
    },
    subheading: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
      marginTop: 6,
      paddingHorizontal: 8,
    },
    featureWrap: {
      marginTop: 12,
    },
    plansWrap: {
      marginTop: 14,
      gap: 10,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 16,
      gap: 8,
    },
  });
}
