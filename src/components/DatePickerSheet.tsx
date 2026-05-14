import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";
import { isValidDateKey } from "../utils/date";

import WheelPicker, { WheelItem } from "./WheelPicker";

type Props = {
  visible: boolean;
  value: string; // YYYY-MM-DD
  title?: string;
  minYear?: number;
  maxYear?: number;
  onCancel: () => void;
  onConfirm: (value: string) => void;
};

const OPEN_DURATION = 240;
const CLOSE_DURATION = 200;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseValue(
  v: string,
  fallback: { y: number; m: number; d: number }
): { y: number; m: number; d: number } {
  if (!isValidDateKey(v)) return fallback;
  const [y, m, d] = v.split("-").map(Number);
  return { y, m, d };
}

export default function DatePickerSheet({
  visible,
  value,
  title,
  minYear,
  maxYear,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();

  const today = useMemo(() => {
    const now = new Date();
    return {
      y: now.getFullYear(),
      m: now.getMonth() + 1,
      d: now.getDate(),
    };
  }, []);

  const yearMax = maxYear ?? today.y;
  const yearMin = minYear ?? 1970;

  const [year, setYear] = useState<number>(today.y);
  const [month, setMonth] = useState<number>(today.m);
  const [day, setDay] = useState<number>(today.d);

  // 시트의 슬라이드/페이드 애니메이션은 백드롭과 시트를 분리해서 처리한다.
  // animationType="slide"를 그대로 쓰면 Modal 컨테이너 전체가 함께 슬라이드되어
  // 백드롭(dim)까지 같이 올라와 보이기 때문이다.
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  // 시트 높이는 onLayout 후 확정되므로 state로 관리해 interpolate가 갱신되게 한다.
  const [sheetHeight, setSheetHeight] = useState(800);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: CLOSE_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, progress]);

  // 시트가 열릴 때마다 외부 value로부터 내부 상태를 초기화한다.
  useEffect(() => {
    if (!visible) return;
    const init = parseValue(value, today);
    setYear(init.y);
    setMonth(init.m);
    setDay(init.d);
  }, [visible, value, today]);

  const yearItems: WheelItem[] = useMemo(() => {
    const items: WheelItem[] = [];
    for (let y = yearMax; y >= yearMin; y -= 1) {
      items.push({ value: String(y), label: String(y) });
    }
    return items;
  }, [yearMax, yearMin]);

  const monthItems: WheelItem[] = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: pad2(i + 1),
      })),
    []
  );

  const dayItems: WheelItem[] = useMemo(() => {
    const max = daysInMonth(year, month);
    return Array.from({ length: max }, (_, i) => ({
      value: String(i + 1),
      label: pad2(i + 1),
    }));
  }, [year, month]);

  // 월/년 변경으로 일 수가 줄어들면 day를 보정한다 (예: 1/31 → 2월 → 28/29).
  useEffect(() => {
    const max = daysInMonth(year, month);
    if (day > max) setDay(max);
  }, [year, month, day]);

  const onPressConfirm = () => {
    const next = `${year}-${pad2(month)}-${pad2(day)}`;
    onConfirm(next);
  };

  const onSheetLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && Math.abs(h - sheetHeight) > 0.5) setSheetHeight(h);
  };

  const backdropStyle = { opacity: progress };
  const sheetStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [sheetHeight, 0],
          }),
        },
      ],
    }),
    [progress, sheetHeight]
  );

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              paddingBottom:
                (Platform.OS === "ios" ? 24 : 16) + bottomInset,
            },
          ]}
          onLayout={onSheetLayout}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <View style={styles.headerRow}>
            <Pressable hitSlop={8} onPress={onCancel}>
              <Text style={styles.cancelText}>{t("common.cancel")}</Text>
            </Pressable>
            <Text style={styles.titleText}>{title ?? ""}</Text>
            <Pressable hitSlop={8} onPress={onPressConfirm}>
              <Text style={styles.confirmText}>{t("common.confirm")}</Text>
            </Pressable>
          </View>
          <View style={styles.pickerRow}>
            <View style={styles.column}>
              <WheelPicker
                items={yearItems}
                selectedValue={String(year)}
                onChange={(v) => setYear(Number(v))}
              />
            </View>
            <Separator color={theme.textMuted} />
            <View style={styles.column}>
              <WheelPicker
                items={monthItems}
                selectedValue={String(month)}
                onChange={(v) => setMonth(Number(v))}
              />
            </View>
            <Separator color={theme.textMuted} />
            <View style={styles.column}>
              <WheelPicker
                items={dayItems}
                selectedValue={String(day)}
                onChange={(v) => setDay(Number(v))}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Separator({ color }: { color: string }) {
  return (
    <View style={separatorStyles.wrap}>
      <Text style={[separatorStyles.dot, { color }]}>·</Text>
    </View>
  );
}

const separatorStyles = StyleSheet.create({
  wrap: {
    width: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    fontSize: 22,
    fontWeight: "800",
  },
});

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1 },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.backdrop,
    },
    sheet: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.sheetBg,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
    },
    handleWrap: {
      alignItems: "center",
      paddingTop: 8,
      paddingBottom: 4,
    },
    handle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.handleColor,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.cardBorder,
    },
    cancelText: {
      color: theme.textMuted,
      fontSize: 15,
      fontWeight: "500",
      minWidth: 44,
    },
    titleText: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    confirmText: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: "800",
      minWidth: 44,
      textAlign: "right",
    },
    pickerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    column: { flex: 1 },
  });
}
