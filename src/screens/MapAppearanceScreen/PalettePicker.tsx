import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MAP_PALETTES, type MapPalette } from "../../theme/mapPalettes";
import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  // 미리보기 스와치를 어느 모드 기준으로 그릴지 (현재 지도 mode와 맞춤).
  previewMode: "light" | "dark";
  currentId: string;
  labelOf: (palette: MapPalette) => string;
  onSelect: (id: string) => void;
};

// 도트 팔레트 그리드 선택자.
// 한 행에 3개씩 wrap해 전체 10개가 한눈에 보이도록 한다 — 가로 스크롤 없이
// 비교가 쉬워진다. 각 스와치는 해당 팔레트의 level 1~4 색을 한 줄로 보여줘
// gradient를 미리 본다.
export default function PalettePicker({
  theme,
  previewMode,
  currentId,
  labelOf,
  onSelect,
}: Props) {
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.grid}>
      {MAP_PALETTES.map((palette) => {
        const selected = palette.id === currentId;
        const shades =
          previewMode === "dark" ? palette.dark : palette.light;
        return (
          <Pressable
            key={palette.id}
            onPress={() => onSelect(palette.id)}
            style={({ pressed }) => [
              styles.swatchCard,
              selected && styles.swatchCardSelected,
              pressed && !selected && { opacity: 0.7 },
            ]}
          >
            <View style={styles.swatchRow}>
              {/* level 0 은 "방문 없음" 회색이라 미리보기에서 빼고 1~4만 보여준다 */}
              {shades.slice(1).map((c, i) => (
                <View
                  key={i}
                  style={[styles.swatchDot, { backgroundColor: c }]}
                />
              ))}
            </View>
            <Text style={styles.swatchLabel} numberOfLines={1}>
              {labelOf(palette)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      // gap을 쓰면 RN 0.71+ 에서 row/column 모두 자동 적용된다.
      gap: 10,
    },
    swatchCard: {
      // 3열 그리드: gap 10 × 2(=20)을 제외한 너비를 3등분.
      // (100% - 20px) / 3 ≈ 33.33% - 6.67px → 안전하게 31.5%로 잡아 wrap을 보장.
      width: "31.5%",
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.cardBorder,
      backgroundColor: theme.cardBg,
      alignItems: "center",
    },
    swatchCardSelected: {
      borderColor: theme.accent,
    },
    swatchRow: {
      flexDirection: "row",
      gap: 4,
      marginBottom: 8,
    },
    swatchDot: {
      width: 12,
      height: 12,
      borderRadius: 3,
    },
    swatchLabel: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
