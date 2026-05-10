import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";

type Props = {
  current: number; // 1..total
  total: number;
  /** 제공되면 진행률 좌측에 뒤로가기 버튼이 노출된다. step 단위로 한 단계씩 이전으로 이동. */
  onBack?: () => void;
};

export default function OnboardingProgress({ current, total, onBack }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ratio = Math.max(0, Math.min(1, current / total));
    Animated.timing(value, {
      toValue: ratio,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [current, total, value]);

  const widthInterp = value.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressRow}>
        {onBack && (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={localStyles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="back"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Path
                d="M15 6l-6 6 6 6"
                stroke={theme.textPrimary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Pressable>
        )}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: widthInterp }]} />
        </View>
        <Text style={styles.progressLabel}>{`${current}/${total}`}</Text>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  backBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -4,
  },
});
