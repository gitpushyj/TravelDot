import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  label: string;
  sub: string;
  onPress: () => void;
  divider?: boolean;
  disabled?: boolean;
};

export default function ActionRow({
  theme,
  label,
  sub,
  onPress,
  divider,
  disabled,
}: Props) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      {!disabled && <Text style={styles.chev}>›</Text>}
    </Pressable>
  );
}
