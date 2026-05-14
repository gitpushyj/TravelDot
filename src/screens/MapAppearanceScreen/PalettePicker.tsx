import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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

// 도트 팔레트 가로 스크롤 선택자.
// 각 스와치는 해당 팔레트의 level 1~4 색을 한 줄로 보여줘서 gradient를 미리 본다.
export default function PalettePicker({
  theme,
  previewMode,
  currentId,
  labelOf,
  onSelect,
}: Props) {
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
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
    </ScrollView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 4,
      gap: 10,
    },
    swatchCard: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.cardBorder,
      backgroundColor: theme.cardBg,
      alignItems: "center",
      minWidth: 84,
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
