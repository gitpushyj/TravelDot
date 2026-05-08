import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "../../theme/themeStore";
import type { MainScreenStyles } from "./styles";

type Props = {
  styles: MainScreenStyles;
  onShare: () => void;
  onZoom: () => void;
  shareA11yLabel: string;
  zoomA11yLabel: string;
};

// 지도 아래 별개 섹션으로 위치하는 액션 row. 공유와 풀화면 버튼만 둔다.
// 지도 영역 위에는 어떤 플로팅 UI도 두지 않아 지도 자체를 깔끔하게 유지한다.
export default function MapActions({
  styles,
  onShare,
  onZoom,
  shareA11yLabel,
  zoomA11yLabel,
}: Props) {
  const theme = useTheme();
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
        <ShareIcon color={theme.textPrimary} />
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

// iOS 시스템 share와 동일한 형태: 위로 향하는 화살표 + 양옆이 열린 박스.
function ShareIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15V3M12 3l-4 4M12 3l4 4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
