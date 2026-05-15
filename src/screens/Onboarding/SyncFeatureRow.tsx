import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  Icon: React.ComponentType<{ size?: number; color: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
  descEmphasis?: string;
};

export default function SyncFeatureRow({
  theme,
  Icon,
  iconColor,
  iconBg,
  title,
  desc,
  descEmphasis,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon size={24} color={iconColor} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>
          {desc}
          {descEmphasis ? (
            <Text style={styles.descEmphasis}>{descEmphasis}</Text>
          ) : null}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    paddingTop: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  desc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  descEmphasis: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
