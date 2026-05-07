import { useEffect, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import {
  loadYearSummaries,
  type YearSummary,
} from "../features/travel/visitRepository";
import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";

export type YearMode = { kind: "all" } | { kind: "year"; year: number };

type Props = {
  visible: boolean;
  initial: YearMode;
  onCancel: () => void;
  onApply: (mode: YearMode) => void;
};

const NUM_SEGMENTS = 12;
const OPEN_DURATION = 240;
const CLOSE_DURATION = 200;

export default function YearPickerModal({
  visible,
  initial,
  onCancel,
  onApply,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();
  const [summaries, setSummaries] = useState<YearSummary[] | null>(null);

  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const sheetHeight = useSharedValue(1000);
  // 사용자가 시트를 아래로 끌어내릴 때의 추가 오프셋. 0 이상으로만 누적된다.
  const dragOffset = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // 다시 열릴 때 이전 드래그 잔여값이 남아 있지 않도록 초기화.
      dragOffset.value = 0;
      progress.value = withTiming(1, {
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    } else if (mounted) {
      progress.value = withTiming(
        0,
        { duration: CLOSE_DURATION, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        },
      );
    }
  }, [visible, mounted, progress, dragOffset]);

  const backdropStyle = useAnimatedStyle(() => {
    const h = sheetHeight.value;
    const dragRatio = h > 0 ? Math.min(1, dragOffset.value / h) : 0;
    return {
      opacity: progress.value * (1 - dragRatio),
    };
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (1 - progress.value) * sheetHeight.value + dragOffset.value },
    ],
  }));

  const onSheetLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) sheetHeight.value = h;
  };

  // 핸들/헤더 영역에서 시트를 아래로 끌어 닫는 제스처. 25% 이상 끌었거나
  // 아래 방향 속도가 충분하면 닫고, 아니면 원위치로 복귀한다.
  const dismissPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          dragOffset.value = Math.max(0, e.translationY);
        })
        .onEnd((e) => {
          const h = sheetHeight.value;
          const shouldDismiss =
            (h > 0 && dragOffset.value > h * 0.25) || e.velocityY > 800;
          if (shouldDismiss) {
            // 현재 드래그된 위치에서 끊김 없이 close 애니메이션이 이어지도록
            // progress를 즉시 같은 시각 위치로 맞춘 뒤 dragOffset을 0으로 리셋한다.
            progress.value = h > 0 ? Math.max(0, 1 - dragOffset.value / h) : 0;
            dragOffset.value = 0;
            runOnJS(onCancel)();
          } else {
            dragOffset.value = withTiming(0, { duration: 200 });
          }
        }),
    [dragOffset, sheetHeight, progress, onCancel],
  );

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    void loadYearSummaries().then((s) => {
      if (alive) setSummaries(s);
    });
    return () => {
      alive = false;
    };
  }, [visible]);

  // min ~ max 사이의 모든 연도를 채워, 기록 없는 연도도 "기록 없음"으로 노출한다.
  const rows = useMemo(() => {
    if (!summaries || summaries.length === 0) return [];
    const byYear = new Map(summaries.map((s) => [s.year, s]));
    const minY = Math.min(...summaries.map((s) => s.year));
    const maxY = Math.max(...summaries.map((s) => s.year));
    const out: YearSummary[] = [];
    for (let y = maxY; y >= minY; y -= 1) {
      out.push(
        byYear.get(y) ?? { year: y, days: 0, countries: 0, monthly: new Array(12).fill(0) }
      );
    }
    return out;
  }, [summaries]);

  const allRange = useMemo(() => {
    if (!summaries || summaries.length === 0) return null;
    const ys = summaries.map((s) => s.year);
    return { min: Math.min(...ys), max: Math.max(...ys) };
  }, [summaries]);

  // "전체 보기" 막대용: 모든 연도의 월별 일수를 합산.
  const totalsMonthly = useMemo(() => {
    const acc = new Array(NUM_SEGMENTS).fill(0);
    if (!summaries) return acc;
    for (const s of summaries) {
      for (let i = 0; i < NUM_SEGMENTS; i += 1) acc[i] += s.monthly[i] ?? 0;
    }
    return acc;
  }, [summaries]);

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { paddingBottom: (Platform.OS === "ios" ? 34 : 16) + bottomInset },
          ]}
          onLayout={onSheetLayout}
        >
          {/* 핸들과 헤더 영역에서만 드래그를 받도록 묶는다. 리스트(ScrollView)는
              자체 스크롤이 우선되어야 하므로 제스처 영역에서 제외한다. */}
          <GestureDetector gesture={dismissPanGesture}>
            <View>
              <View style={styles.handleWrap}>
                <View style={styles.handle} />
              </View>
              <View style={styles.headerRow}>
                <Pressable hitSlop={8} onPress={onCancel}>
                  <Text style={styles.cancelText}>{t("common.cancel")}</Text>
                </Pressable>
                <Text style={styles.titleText}>{t("yearPicker.title")}</Text>
                <View style={styles.headerSpacer} />
              </View>
            </View>
          </GestureDetector>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <YearRow
              theme={theme}
              title={t("yearPicker.viewAll")}
              subtitle={
                allRange
                  ? t("yearPicker.viewAllRange", {
                      min: allRange.min,
                      max: allRange.max,
                    })
                  : t("yearPicker.viewAllNoRange")
              }
              monthly={totalsMonthly}
              selected={initial.kind === "all"}
              muted={false}
              onPress={() => onApply({ kind: "all" })}
            />
            {rows.map((s) => {
              const isEmpty = s.days === 0;
              const subtitle = isEmpty
                ? t("yearPicker.noRecord")
                : t("yearPicker.yearMeta", {
                    days: s.days,
                    countries: s.countries,
                  });
              return (
                <YearRow
                  key={s.year}
                  theme={theme}
                  title={String(s.year)}
                  subtitle={subtitle}
                  monthly={s.monthly}
                  selected={
                    initial.kind === "year" && initial.year === s.year
                  }
                  muted={isEmpty}
                  onPress={() => onApply({ kind: "year", year: s.year })}
                />
              );
            })}
          </ScrollView>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function YearRow({
  theme,
  title,
  subtitle,
  monthly,
  selected,
  muted,
  onPress,
}: {
  theme: Theme;
  title: string;
  subtitle: string;
  monthly: number[];
  selected: boolean;
  muted: boolean;
  onPress: () => void;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <Text
        style={[
          styles.yearText,
          muted && styles.yearMuted,
        ]}
      >
        {title}
      </Text>
      <View style={styles.rowMain}>
        <Text style={[styles.subText, muted && styles.subMuted]}>
          {subtitle}
        </Text>
        <SegmentBar theme={theme} monthly={monthly} muted={muted} />
      </View>
      <View
        style={[
          styles.radio,
          selected && styles.radioSelected,
        ]}
      >
        {selected && <Text style={styles.radioCheck}>✓</Text>}
      </View>
    </Pressable>
  );
}

function SegmentBar({
  theme,
  monthly,
  muted,
}: {
  theme: Theme;
  monthly: number[];
  muted: boolean;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const empty = theme.heatmap[0];
  const light = theme.heatmap[2];
  const dark = theme.heatmap[4];
  return (
    <View style={styles.bar}>
      {Array.from({ length: NUM_SEGMENTS }).map((_, i) => {
        const days = monthly[i] ?? 0;
        let color: string = empty;
        if (!muted) {
          if (days >= 4) color = dark;
          else if (days >= 1) color = light;
        }
        return <View key={i} style={[styles.seg, { backgroundColor: color }]} />;
      })}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
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
      paddingBottom: Platform.OS === "ios" ? 34 : 16,
      maxHeight: "85%",
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
      minWidth: 40,
    },
    titleText: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    headerSpacer: {
      minWidth: 40,
    },
    list: {
      flexGrow: 0,
    },
    listContent: {
      paddingHorizontal: 8,
      paddingTop: 4,
      paddingBottom: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 14,
      gap: 14,
    },
    rowSelected: {
      backgroundColor: theme.selectedRowBg,
    },
    yearText: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: "800",
      width: 80,
    },
    yearMuted: {
      color: theme.textMuted,
    },
    rowMain: {
      flex: 1,
      gap: 8,
    },
    subText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    subMuted: {
      color: theme.textMuted,
    },
    bar: {
      flexDirection: "row",
      gap: 3,
    },
    seg: {
      flex: 1,
      height: 8,
      borderRadius: 2,
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.radioBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    radioSelected: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    radioCheck: {
      color: theme.radioCheckColor,
      fontSize: 13,
      fontWeight: "900",
      marginTop: -1,
    },
  });
}
