import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
};

// 도트 색이 방문 횟수에 따라 진해진다는 사실을 사용자에게 알려주는 작은 범례.
// 시야를 최대한 적게 가리도록 좌측 하단(보통 남대서양/남극 인근 빈 공간)에
// 칩 형태로 띄운다. 다섯 단계 중 0회(미방문) 회색은 의미 전달에 도움이 되지
// 않아 1~4단계 색상 4개만 노출한다.
export default function Legend({ theme }: Props) {
  const { t } = useTranslation();
  const swatches = theme.heatmap.slice(1);
  const isDark = theme.statusBar === "light";
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
