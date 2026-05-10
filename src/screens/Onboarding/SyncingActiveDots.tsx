import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type Props = { color: string };

// 3개의 도트가 시간차로 부풀고 사라지는 "타이핑 인디케이터" 패턴.
// 작은 영역에서도 회전 스피너보다 움직임이 또렷하게 인지된다.
const DURATION = 520;
const STAGGER = 160;
const MIN_OPACITY = 0.25;
const MIN_SCALE = 0.6;

export default function SyncingActiveDots({ color }: Props) {
  const v1 = useSharedValue(MIN_OPACITY);
  const v2 = useSharedValue(MIN_OPACITY);
  const v3 = useSharedValue(MIN_OPACITY);

  useEffect(() => {
    const animate = (sv: typeof v1, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration: DURATION,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true,
        ),
      );
    };
    animate(v1, 0);
    animate(v2, STAGGER);
    animate(v3, STAGGER * 2);
  }, [v1, v2, v3]);

  const s1 = useAnimatedStyle(() => ({
    opacity: v1.value,
    transform: [{ scale: MIN_SCALE + v1.value * (1 - MIN_SCALE) }],
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity: v2.value,
    transform: [{ scale: MIN_SCALE + v2.value * (1 - MIN_SCALE) }],
  }));
  const s3 = useAnimatedStyle(() => ({
    opacity: v3.value,
    transform: [{ scale: MIN_SCALE + v3.value * (1 - MIN_SCALE) }],
  }));

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, s1]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, s2]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, s3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
