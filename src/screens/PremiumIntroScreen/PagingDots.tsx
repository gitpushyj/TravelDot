import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import type { Theme } from "../../theme/theme";
import { useTheme } from "../../theme/themeStore";

type Props = {
  count: number;
  activeIndex: number;
};

// 캐러셀 하단 점 인디케이터. 활성 점은 가로로 길어지고 accent 색.
export default function PagingDots({ count, activeIndex }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === activeIndex ? styles.dotActive : null]}
        />
      ))}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      paddingVertical: 10,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.cardBorder,
    },
    dotActive: {
      width: 18,
      backgroundColor: theme.accent,
    },
  });
}
