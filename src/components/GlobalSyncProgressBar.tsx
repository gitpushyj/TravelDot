import { useEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigationState } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useVisitStore } from "../features/travel/visitStore";
import { useTheme } from "../theme/themeStore";

// MainTabs(BottomTab) 위에 떠 있을 때 가려지지 않도록 띄울 기본 거리.
// React Navigation BottomTab 기본 높이가 약 49이고 SafeArea 하단 inset이 따로
// 더해진다. 우리는 inset을 별도로 더하므로 여기엔 BottomTab 본체만 잡는다.
const TAB_BAR_HEIGHT = 49;
// 진행바 위/아래 여유.
const FLOAT_GAP = 8;

export default function GlobalSyncProgressBar() {
  const syncStatus = useVisitStore((s) => s.syncStatus);
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // 현재 활성 stack의 최상위 라우트가 'Main'(=MainTabs)인지 판별한다.
  // Stack push된 화면(TripDetail 등)에서는 BottomTab이 사라지므로 띄울 위치가
  // 다르다.
  const isInMainTabs = useNavigationState((state) => {
    if (!state) return false;
    const top = state.routes[state.index];
    return top?.name === "Main";
  });

  const visible = syncStatus.running;

  // fade in/out
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 220 });
    translateY.value = withTiming(visible ? 0 : 8, { duration: 220 });
  }, [visible, opacity, translateY]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const message = useMemo(() => {
    const phase = syncStatus.phase ?? "scanning";
    if (phase === "saving") return t("sync.saving");
    if (phase === "verifying") return t("sync.verifying");
    return t("sync.scanning", { processed: syncStatus.processed });
  }, [syncStatus.phase, syncStatus.processed, t]);

  if (!visible) return null;

  const bottomOffset = isInMainTabs
    ? TAB_BAR_HEIGHT + insets.bottom + FLOAT_GAP
    : insets.bottom + FLOAT_GAP;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { bottom: bottomOffset }, animStyle]}
    >
      <View style={styles.bar}>
        <ActivityIndicator size="small" color={theme.accent} />
        <Text style={styles.text} numberOfLines={1}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    wrap: {
      position: "absolute",
      left: 12,
      right: 12,
      alignItems: "center",
    },
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: theme.cardBg,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 4,
      maxWidth: "100%",
    },
    text: {
      color: theme.accentSoftText,
      fontSize: 13,
      fontWeight: "600",
      flexShrink: 1,
    },
  });
}
