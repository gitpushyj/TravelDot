import React from "react";
import { StyleSheet, Text } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = { theme: Theme; text: string };

export default function FooterDisclaimer({ theme, text }: Props) {
  const styles = makeStyles(theme);
  return <Text style={styles.text}>{text}</Text>;
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    text: {
      color: theme.textMuted,
      fontSize: 11,
      lineHeight: 16,
      textAlign: "center",
    },
  });
}
