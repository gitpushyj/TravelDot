import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  loadYearSummaries,
  type YearSummary,
} from "../features/travel/visitRepository";
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

export default function YearPickerModal({
  visible,
  initial,
  onCancel,
  onApply,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [summaries, setSummaries] = useState<YearSummary[] | null>(null);

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.sheet}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <View style={styles.headerRow}>
            <Pressable hitSlop={8} onPress={onCancel}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
            <Text style={styles.titleText}>연도 선택</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <YearRow
              theme={theme}
              title="전체 보기"
              subtitle={
                allRange
                  ? `${allRange.min} — ${allRange.max} · 모든 기록`
                  : "모든 기록"
              }
              monthly={totalsMonthly}
              selected={initial.kind === "all"}
              muted={false}
              onPress={() => onApply({ kind: "all" })}
            />
            {rows.map((s) => {
              const isEmpty = s.days === 0;
              const subtitle = isEmpty
                ? "기록 없음"
                : `${s.days}일 · ${s.countries} 도트`;
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
        </View>
      </View>
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
    backdrop: {
      flex: 1,
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
