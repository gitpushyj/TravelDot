import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = { theme: Theme; brand: string };

// 상단 콜라주 영역. 외부 이미지 의존 없이 그라데이션/색면으로 구성하고
// 가운데에 앱 브랜드 텍스트를 얹어 스크린샷의 분위기만 차용한다.
export default function HeroCollage({ theme, brand }: Props) {
  const styles = makeStyles(theme);
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={[styles.tile, styles.tileTopLeft]} />
        <View style={[styles.tile, styles.tileTopRight]} />
      </View>
      <View style={styles.brandRow}>
        <Text style={styles.brandText}>{brand}</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.tile, styles.tileBottomLeft]} />
        <View style={[styles.tile, styles.tileBottomRight]} />
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      paddingTop: 8,
      paddingHorizontal: 12,
    },
    row: {
      flexDirection: "row",
      gap: 8,
    },
    tile: {
      flex: 1,
      height: 96,
      borderRadius: 12,
    },
    tileTopLeft: { backgroundColor: theme.accentSoftBg },
    tileTopRight: { backgroundColor: theme.heatmap[1] },
    tileBottomLeft: { backgroundColor: theme.heatmap[3] },
    tileBottomRight: { backgroundColor: theme.flagBoxBg },
    brandRow: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
    },
    brandText: {
      color: theme.accent,
      fontSize: 40,
      fontWeight: "300",
      letterSpacing: -0.5,
    },
  });
}
