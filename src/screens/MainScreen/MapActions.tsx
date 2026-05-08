import { Pressable, Text, View } from "react-native";

import type { MainScreenStyles } from "./styles";

type Props = {
  styles: MainScreenStyles;
  onShare: () => void;
  onZoom: () => void;
  shareA11yLabel: string;
  zoomA11yLabel: string;
};

// 지도 카드 하단 우측에 위치하는 액션 row. 공유(↗)와 풀화면(⛶) 버튼만 둔다.
// 지도 영역 위에는 어떤 플로팅 UI도 두지 않아 지도 자체를 깔끔하게 유지한다.
export default function MapActions({
  styles,
  onShare,
  onZoom,
  shareA11yLabel,
  zoomA11yLabel,
}: Props) {
  return (
    <View style={styles.mapActions}>
      <Pressable
        onPress={onShare}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={shareA11yLabel}
        style={({ pressed }) => [
          styles.mapActionBtn,
          pressed && styles.mapActionBtnPressed,
        ]}
      >
        <Text style={styles.mapActionIcon}>↗</Text>
      </Pressable>
      <Pressable
        onPress={onZoom}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={zoomA11yLabel}
        style={({ pressed }) => [
          styles.mapActionBtn,
          pressed && styles.mapActionBtnPressed,
        ]}
      >
        <Text style={styles.mapActionIcon}>⛶</Text>
      </Pressable>
    </View>
  );
}
