import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  titleLine1: string;
  titleHighlight: string;
  subtitle: string;
};

export default function SyncingHero({
  theme,
  titleLine1,
  titleHighlight,
  subtitle,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Image
        source={require("../../../assets/four_earth.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {titleLine1}
      </Text>
      <Text style={[styles.title, { color: theme.accent }]}>
        {titleHighlight}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  image: {
    width: 220,
    height: 220,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 14,
  },
});
