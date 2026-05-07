import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  title: string;
  body: string;
};

export default function SyncPermissionNotice({ theme, title, body }: Props) {
  return (
    <View style={[styles.box, { backgroundColor: theme.accentSoftBg }]}>
      <View style={styles.iconWrap}>
        <FilledLockIcon color={theme.accent} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.accentSoftText }]}>{title}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{body}</Text>
      </View>
    </View>
  );
}

function FilledLockIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 11V8a5 5 0 0110 0v3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Rect x={4} y={11} width={16} height={10} rx={2} fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    padding: 14,
  },
  iconWrap: {
    paddingTop: 1,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
});
