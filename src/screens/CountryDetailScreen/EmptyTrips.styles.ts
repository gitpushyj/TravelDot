import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export function makeEmptyTripsStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      paddingTop: 40,
      paddingBottom: 24,
    },
    illustration: {
      width: 200,
      height: 160,
      marginBottom: 16,
    },
    line: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "500",
      textAlign: "center",
      lineHeight: 22,
    },
  });
}
