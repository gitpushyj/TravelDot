import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  prefix: string;
  highlight: string;
  suffix: string;
};

export default function SyncingAutoNextNotice({
  theme,
  prefix,
  highlight,
  suffix,
}: Props) {
  return (
    <View style={[styles.box, { backgroundColor: theme.accentSoftBg }]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.accent }]}>
        <Text style={styles.iconChar}>i</Text>
      </View>
      <Text style={[styles.text, { color: theme.textPrimary }]}>
        {prefix}
        <Text style={[styles.highlight, { color: theme.accent }]}>
          {highlight}
        </Text>
        {suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  iconChar: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  highlight: {
    fontWeight: "700",
  },
});
