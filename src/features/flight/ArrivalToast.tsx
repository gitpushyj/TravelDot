import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";
import type { Theme } from "../../theme/theme";

import { useFlightStore } from "./flightStore";

// 도착 처리되면 인앱 스낵바를 띄운다. 일정 시간 후 자동 fade out되며, 사용자가
// 우측 ✕ 버튼이나 라벨 영역을 탭해 즉시 닫을 수도 있다.
// 메인 화면에 한 번 mount해 두면 flightStore.arrived가 채워질 때마다 발동.
const AUTO_HIDE_MS = 8000;
const FADE_MS = 220;

export default function ArrivalToast() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const arrived = useFlightStore((s) => s.arrived);
  const consumeArrived = useFlightStore((s) => s.consumeArrived);

  const opacity = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<null | NonNullable<typeof arrived>>(null);
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setShown(null);
    });
  }, [opacity]);

  useEffect(() => {
    if (!arrived) return;
    setShown(arrived);
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();

    if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    autoHideTimer.current = setTimeout(() => {
      autoHideTimer.current = null;
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setShown(null);
      });
    }, AUTO_HIDE_MS);

    // 다음 도착이 들어와도 한 번에 하나만 표시되도록 즉시 consume.
    consumeArrived();

    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
        autoHideTimer.current = null;
      }
    };
  }, [arrived, opacity, consumeArrived]);

  if (!shown) return null;

  return (
    <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="box-none">
      <View style={styles.snackbar}>
        <Pressable
          onPress={dismiss}
          style={({ pressed }) => [
            styles.textArea,
            pressed && styles.textAreaPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("flight.arrivedToast", {
            iata: shown.destination.iata,
            city: shown.destination.city,
          })}
        >
          <Text style={styles.text} numberOfLines={2}>
            {t("flight.arrivedToast", {
              iata: shown.destination.iata,
              city: shown.destination.city,
            })}
          </Text>
        </Pressable>
        <Pressable
          onPress={dismiss}
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && styles.closeBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function makeStyles(_theme: Theme) {
  return StyleSheet.create({
    wrap: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 40,
      alignItems: "center",
    },
    snackbar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      borderRadius: 12,
      paddingLeft: 16,
      paddingRight: 4,
      paddingVertical: 4,
      minHeight: 48,
      maxWidth: "100%",
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 6,
    },
    textArea: {
      flex: 1,
      paddingVertical: 12,
      paddingRight: 8,
    },
    textAreaPressed: { opacity: 0.7 },
    text: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    closeBtnPressed: { backgroundColor: "rgba(255,255,255,0.12)" },
    closeIcon: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
