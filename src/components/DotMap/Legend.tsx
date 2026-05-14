import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { HeatmapPalette } from "../../theme/mapPalettes";

type Props = {
  // 사용자가 고른 도트 팔레트의 5단계 색상. theme이 아니라 mapTheme 기준으로
  // 받아야 팔레트 변경이 즉시 범례에도 반영된다.
  heatmap: HeatmapPalette;
  // 칩 배경/글자 대비를 정하는 데 쓰는 지도 모드 (잠긴 상태도 반영).
  mode: "light" | "dark";
};

// 도트 색이 방문 횟수에 따라 진해진다는 사실을 사용자에게 알려주는 작은 범례.
// 시야를 최대한 적게 가리도록 좌측 하단(보통 남대서양/남극 인근 빈 공간)에
// 칩 형태로 띄운다. 다섯 단계 중 0회(미방문) 회색은 의미 전달에 도움이 되지
// 않아 1~4단계 색상 4개만 노출한다.
export default function Legend({ heatmap, mode }: Props) {
  const { t } = useTranslation();
  const swatches = heatmap.slice(1);
  const isDark = mode === "dark";
  const bg = isDark ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.85)";
  const labelColor = isDark ? "#f5f5f7" : "#1a1a1a";
  return (
    <View pointerEvents="none" style={[styles.root, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: labelColor }]}>
        {t("dotMap.legendLow")}
      </Text>
      {swatches.map((c, i) => (
        <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
      ))}
      <Text style={[styles.label, { color: labelColor }]}>
        {t("dotMap.legendHigh")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 6,
    bottom: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  label: {
    fontSize: 9,
    fontWeight: "600",
  },
  swatch: {
    width: 6,
    height: 6,
    borderRadius: 1.5,
  },
});
