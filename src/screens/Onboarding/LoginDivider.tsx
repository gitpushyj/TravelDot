import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = { theme: Theme; label: string };

export default function LoginDivider({ theme, label }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.line, { backgroundColor: theme.cardBorder }]} />
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <View style={[styles.line, { backgroundColor: theme.cardBorder }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
