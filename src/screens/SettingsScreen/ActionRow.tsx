import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  label: string;
  sub?: string;
  onPress: () => void;
  divider?: boolean;
  // 진짜로 탭을 막을 때만 true (예: 계정 정보 행처럼 정보 표시용).
  disabled?: boolean;
  // 유료 잠금처럼 시각적으로는 흐리지만 탭은 살아 있을 때 true.
  // 누르면 구독 화면으로 안내한다.
  locked?: boolean;
  // 우측 작은 뱃지 (예: "PRO 🔒").
  trailingBadge?: string;
};

export default function ActionRow({
  theme,
  label,
  sub,
  onPress,
  divider,
  disabled,
  locked,
  trailingBadge,
}: Props) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const muted = disabled || locked;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        divider && styles.rowDivider,
        !disabled && pressed && { backgroundColor: theme.rowPressedBg },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, muted && { color: theme.textMuted }]}>
          {label}
        </Text>
        {sub ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      {trailingBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{trailingBadge}</Text>
        </View>
      )}
      {!disabled && !locked && <Text style={styles.chev}>›</Text>}
    </Pressable>
  );
}
