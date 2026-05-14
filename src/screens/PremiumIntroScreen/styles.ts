import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
    },
    carousel: {
      flex: 1,
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 4,
      gap: 0,
    },
  });
}
