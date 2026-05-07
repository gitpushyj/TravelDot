import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  Icon: React.ComponentType<{ size?: number; color: string }>;
  title: string;
  desc: string;
};

export default function LoginFeatureCard({ theme, Icon, title, desc }: Props) {
  return (
    <View style={styles.col}>
      <View style={[styles.iconWrap, { backgroundColor: theme.accentSoftBg }]}>
        <Icon size={26} color={theme.accent} />
      </View>
      <Text
        style={[styles.title, { color: theme.textPrimary }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={[styles.desc, { color: theme.textSecondary }]}
        numberOfLines={2}
      >
        {desc}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  desc: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
});
