import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

// Apple App Store Review Guideline 3.1.1 — 유료 기능을 가진 앱은 Restore Purchases를
// 명확한 위치에 노출해야 한다. Disclaimer 아래 작은 텍스트 링크 형태로 둔다.
export default function RestoreLink({ theme, label, disabled, onPress }: Props) {
  const styles = makeStyles(theme);
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8}>
      <Text style={[styles.text, disabled && styles.disabled]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    text: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 16,
      textAlign: "center",
      textDecorationLine: "underline",
    },
    disabled: {
      opacity: 0.4,
    },
  });
}
