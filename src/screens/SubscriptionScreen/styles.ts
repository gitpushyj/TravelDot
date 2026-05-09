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
      paddingTop: 56,
      paddingBottom: 4,
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
      paddingTop: 16,
      paddingBottom: 32,
    },
    heading: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: "800",
      textAlign: "center",
      marginTop: 16,
    },
    headingAccent: {
      color: theme.accent,
    },
    subheading: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
      marginTop: 12,
      paddingHorizontal: 8,
    },
    plansWrap: {
      marginTop: 24,
      gap: 12,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      gap: 12,
    },
  });
}
