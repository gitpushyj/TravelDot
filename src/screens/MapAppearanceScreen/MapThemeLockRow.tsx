import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";
import type { MapThemeLock } from "../../theme/themeStore";

type Option = { value: MapThemeLock; label: string };

type Props = {
  theme: Theme;
  current: MapThemeLock;
  options: Option[];
  onSelect: (value: MapThemeLock) => void;
};

// 지도 테마 고정 선택자. "system | light | dark" 3-segment.
// 앱 전체 테마 선택자와 동일한 시각 구조를 따른다.
export default function MapThemeLockRow({
  theme,
  current,
  options,
  onSelect,
}: Props) {
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      {options.map((opt, idx) => {
        const selected = current === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={({ pressed }) => [
              styles.cell,
              idx > 0 && styles.cellDivider,
              pressed && !selected && { opacity: 0.6 },
            ]}
          >
            <Text style={[styles.cellText, selected && styles.cellTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      overflow: "hidden",
    },
    cell: {
      flex: 1,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    cellDivider: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: theme.cardBorder,
    },
    cellText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
    cellTextActive: {
      color: theme.accent,
      fontWeight: "700",
    },
  });
}
