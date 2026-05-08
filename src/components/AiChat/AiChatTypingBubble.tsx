import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/themeStore";

// 답변 대기 중에 어시스턴트 자리에 보여주는 타이핑 버블.
// "타이핑 중…" 라벨 + 옆에 점 3개가 차례로 깜빡인다.
export default function AiChatTypingBubble() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const seq = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        ])
      );
    const a = seq(dot1, 0);
    const b = seq(dot2, 150);
    const c = seq(dot3, 300);
    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <Text style={styles.label}>{t("aiChat.thinking")}</Text>
        <View style={styles.dots}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    row: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      flexDirection: "row",
      justifyContent: "flex-start",
    },
    bubble: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      maxWidth: "82%",
      borderRadius: 14,
      borderBottomLeftRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.cardBg,
    },
    label: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    dots: {
      flexDirection: "row",
      gap: 3,
      marginLeft: 2,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.textSecondary,
    },
  });
}
