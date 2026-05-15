import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "../../../theme/themeStore";

// secondsLeft가 100ms 간격으로 0.1씩 줄어드는 동안, Reanimated로
// 각 스텝 사이를 linear 보간(120ms — tick 간격보다 살짝 길게)해서
// 막대가 끊김 없이 스르르 줄어드는 것처럼 보이도록 한다.
// 3초 이하면 경고색.
const TWEEN_MS = 120;

export function TimerBar({
  secondsLeft,
  total,
}: {
  secondsLeft: number;
  total: number;
}) {
  const theme = useTheme();
  const ratio = Math.max(0, Math.min(1, secondsLeft / total));
  const warning = secondsLeft <= 3;

  const progress = useSharedValue(ratio);

  useEffect(() => {
    // 새 문제 시작(가득 차는 순간)은 즉시 스냅, 그 외에는 부드럽게 보간.
    if (ratio >= 1) {
      progress.value = 1;
    } else {
      progress.value = withTiming(ratio, {
        duration: TWEEN_MS,
        easing: Easing.linear,
      });
    }
  }, [ratio, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      style={{
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.cardBorder,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          {
            height: "100%",
            backgroundColor: warning ? theme.dangerOn : theme.accent,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}
