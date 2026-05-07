import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Text, View } from "react-native";

import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";

type Props = {
  current: number; // 1..total
  total: number;
};

export default function OnboardingProgress({ current, total }: Props) {
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
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: widthInterp }]} />
        </View>
        <Text style={styles.progressLabel}>{`${current}/${total}`}</Text>
      </View>
    </View>
  );
}
