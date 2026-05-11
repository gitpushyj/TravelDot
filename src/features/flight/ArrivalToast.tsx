import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";
import type { Theme } from "../../theme/theme";

import { useFlightStore } from "./flightStore";

const VISIBLE_MS = 5000;
const FADE_MS = 220;

// 비행이 도착 처리되면 5초간 인앱 토스트를 띄운다.
// 메인 화면 같은 곳에 한 번 mount해 두면, flightStore.arrived가 새로 채워질 때마다 발동.
export default function ArrivalToast() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const arrived = useFlightStore((s) => s.arrived);
  const consumeArrived = useFlightStore((s) => s.consumeArrived);

  const opacity = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<null | NonNullable<typeof arrived>>(null);

  useEffect(() => {
    if (!arrived) return;
    setShown(arrived);
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    }).start();
    const hideTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShown(null);
        }
      });
    }, VISIBLE_MS);

    // 다음 도착이 들어와도 한 번에 하나만 표시되도록 즉시 consume.
    consumeArrived();

    return () => clearTimeout(hideTimer);
  }, [arrived, opacity, consumeArrived]);

  if (!shown) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity }]}
    >
      <View style={styles.pill}>
        <Text style={styles.text} numberOfLines={1}>
          {t("flight.arrivedToast", {
            iata: shown.destination.iata,
            city: shown.destination.city,
          })}
        </Text>
      </View>
    </Animated.View>
  );
}

function makeStyles(_theme: Theme) {
  return StyleSheet.create({
    wrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 40,
      alignItems: "center",
    },
    pill: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      borderRadius: 999,
      maxWidth: "85%",
    },
    text: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
  });
}
