import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "../../theme/themeStore";

type Props = {
  onUpgrade?: () => void;
};

// 무료 사용자에게 보이는 잠긴 채팅 컴포저.
// 입력 영역 전체가 Pressable이고, 우측의 "Premium" 버튼은 색상/스케일/그림자가
// ping-pong으로 흔들리며 시선을 끈다.
export default function AiChatComposerLocked({ onUpgrade }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // 0 ↔ 1 사이를 1.5초 주기로 왕복. backgroundColor와 scale을 동시에 보간.
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [progress]);

  const ctaAnimStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(
      progress.value,
      [0, 1],
      [theme.accent, theme.ctaShimmer]
    );
    const scale = interpolate(progress.value, [0, 1], [1, 1.04]);
    return {
      backgroundColor: bg,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.root}>
      <View style={styles.inputRow}>
        <Pressable
          onPress={onUpgrade}
          style={({ pressed }) => [
            styles.placeholder,
            pressed ? styles.placeholderPressed : null,
          ]}
        >
          <Text style={styles.placeholderText} numberOfLines={2}>
            {t("aiChat.composerLockedPlaceholder")}
          </Text>
        </Pressable>
        <Animated.View style={[styles.ctaShadowWrap, ctaAnimStyle]}>
          <Pressable
            onPress={onUpgrade}
            style={({ pressed }) => [
              styles.ctaInner,
              pressed ? styles.ctaPressed : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("aiChat.upgrade")}
          >
            <Text style={styles.ctaText} numberOfLines={1}>
              {t("aiChat.premiumCta")}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.cardBorder,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: theme.homeBg,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    placeholder: {
      flex: 1,
      minHeight: 40,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: theme.cardBg,
      justifyContent: "center",
    },
    placeholderPressed: { opacity: 0.7 },
    placeholderText: {
      color: theme.textSecondary,
      fontSize: 15,
    },
    // 그림자는 Animated.View(부모)에 둬야 backgroundColor 보간과 함께 그림자 색도 자연스럽다.
    ctaShadowWrap: {
      borderRadius: 20,
      ...Platform.select({
        ios: {
          shadowColor: theme.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
        },
        android: { elevation: 6 },
      }),
    },
    ctaInner: {
      height: 40,
      paddingHorizontal: 16,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaPressed: { opacity: 0.85 },
    ctaText: {
      color: theme.accentOn,
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
  });
}
