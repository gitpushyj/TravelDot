import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  runFullSync,
  runIncrementalSync,
} from "../features/photoSync/syncService";
import { useTheme, useThemeStore } from "../theme/themeStore";
import type { Theme, ThemeMode } from "../theme/theme";
import { pickActiveBadge, useBadgeStore } from "../features/badges/badgeStore";
import { COUNTRY_NAME_KO_BY_CODE } from "../features/badges/countryNames";
import { useVisitStore } from "../features/travel/visitStore";
import { getTierByCount } from "../features/travel/tierTitles";

type Props = {
  onClose: () => void;
  onAddTrip: () => void;
  onOpenTitles: () => void;
};

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "system", label: "시스템" },
  { mode: "light", label: "라이트" },
  { mode: "dark", label: "다크" },
];

export default function SettingsScreen({ onClose, onAddTrip, onOpenTitles }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const activeId = useBadgeStore((s) => s.activeId);
  const visitCounts = useVisitStore((s) => s.visitCounts);

  const handleIncrementalSync = () => {
    runIncrementalSync().catch((e) => Alert.alert("스캔 실패", String(e)));
  };
  const handleFullSync = () => {
    runFullSync().catch((e) => Alert.alert("스캔 실패", String(e)));
  };

  // 현재 호칭 미리보기 — 활성 뱃지 또는 자동 모드의 등급 뱃지
  const activeBadge = useMemo(() => {
    const tier = getTierByCount(Object.keys(visitCounts).length);
    return pickActiveBadge(activeId, `tier_${tier.id}`, COUNTRY_NAME_KO_BY_CODE);
  }, [activeId, visitCounts]);

  const titleSub = activeBadge
    ? `${activeBadge.emoji} ${activeBadge.titleKo}${activeId == null ? " · 자동" : ""}`
    : "호칭 없음";

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.cancel}>닫기</Text>
        </Pressable>
        <Text style={styles.title}>설정</Text>
        <View style={{ minWidth: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>여행 기록</Text>
        <View style={styles.card}>
          <ActionRow
            theme={theme}
            label="여행 추가"
            sub="국가와 날짜를 직접 입력해 추가"
            onPress={onAddTrip}
          />
          <ActionRow
            theme={theme}
            label="새 사진 자동 추가"
            sub="마지막 스캔 이후의 사진만 빠르게 처리"
            onPress={handleIncrementalSync}
            divider
          />
          <ActionRow
            theme={theme}
            label="사진 재스캔"
            sub="전체 사진을 다시 훑어 기록을 갱신"
            onPress={handleFullSync}
            divider
          />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          호칭
        </Text>
        <View style={styles.card}>
          <ActionRow
            theme={theme}
            label="호칭"
            sub={titleSub}
            onPress={onOpenTitles}
          />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          테마
        </Text>
        <View style={styles.segment}>
          {THEME_OPTIONS.map((opt) => {
            const selected = mode === opt.mode;
            return (
              <Pressable
                key={opt.mode}
                onPress={() => void setMode(opt.mode)}
                style={({ pressed }) => [
                  styles.segmentItem,
                  selected && styles.segmentItemActive,
                  pressed && !selected && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    selected && styles.segmentTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function ActionRow({
  theme,
  label,
  sub,
  onPress,
  divider,
}: {
  theme: Theme;
  label: string;
  sub: string;
  onPress: () => void;
  divider?: boolean;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        divider && styles.rowDivider,
        pressed && { backgroundColor: theme.rowPressedBg },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 56,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
    cancel: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: "600",
      minWidth: 40,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 40,
    },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      marginBottom: 8,
      marginLeft: 4,
      textTransform: "uppercase",
    },
    sectionLabelSpaced: {
      marginTop: 24,
    },
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.cardBorder,
    },
    rowLabel: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    rowSub: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: theme.tabRowBg,
      borderRadius: 999,
      padding: 4,
      gap: 4,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentItemActive: {
      backgroundColor: theme.cardBg,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 1,
    },
    segmentText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    segmentTextActive: {
      color: theme.textPrimary,
      fontWeight: "700",
    },
    chev: {
      color: theme.textMuted,
      fontSize: 22,
      fontWeight: "400",
    },
  });
}
