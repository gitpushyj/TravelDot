import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  title: string;
  subtitle: string;
};

export default function SyncHero({ theme, title, subtitle }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <Image
        source={require("../../../assets/sync_image.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  left: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  image: {
    width: 150,
    height: 150,
  },
});
