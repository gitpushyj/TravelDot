import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export function makeEmptyTripsStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      paddingTop: 16,
      paddingBottom: 24,
    },
    illustration: {
      width: 320,
      height: 320,
      marginBottom: 4,
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
