import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import type { Theme } from "../../theme/theme";

export type RowState = "done" | "active" | "pending";

type Props = {
  theme: Theme;
  Icon: React.ComponentType<{ size?: number; color: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
  state: RowState;
};

export default function SyncingProgressRow({
  theme,
  Icon,
  iconColor,
  iconBg,
  title,
  desc,
  state,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon size={22} color={iconColor} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>{desc}</Text>
      </View>
      <View style={[styles.statusWrap, { backgroundColor: theme.accentSoftBg }]}>
        {state === "done" ? (
          <CheckIcon color={theme.accent} />
        ) : state === "active" ? (
          <ActivityIndicator color={theme.accent} size="small" />
        ) : (
          <View style={[styles.pendingDot, { borderColor: theme.textMuted }]} />
        )}
      </View>
    </View>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5l5 5 9-11"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  desc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  statusWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
