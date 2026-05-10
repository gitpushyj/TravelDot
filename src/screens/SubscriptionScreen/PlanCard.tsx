import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  selected: boolean;
  onPress: () => void;
  title: string;
  // 기간(예: ₩29,000/year). 좌측 메인 라인 아래에 작게 표시. 없으면 생략.
  periodLabel?: string;
  // 우측 가격 — 큰 숫자
  rightPrimary: string;
  // 우측 보조 — 단위 (예: per week)
  rightSecondary: string;
  // 가운데 칩 (예: 3 days free trial). 없으면 생략.
  trialLabel?: string;
  // 우측 상단 배지 (예: Save 92%). 없으면 생략.
  saveLabel?: string;
};

export default function PlanCard({
  theme,
  selected,
  onPress,
  title,
  periodLabel,
  rightPrimary,
  rightSecondary,
  trialLabel,
  saveLabel,
}: Props) {
  const styles = makeStyles(theme, selected);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && !selected && { opacity: 0.85 },
      ]}
    >
      {saveLabel && (
        <View style={styles.saveBadge}>
          <Text style={styles.saveBadgeText}>{saveLabel}</Text>
        </View>
      )}
      <View style={styles.row}>
        <View style={styles.leftWrap}>
          <Text style={styles.title}>{title}</Text>
          {periodLabel && <Text style={styles.period}>{periodLabel}</Text>}
        </View>
        {trialLabel && (
          <View style={styles.trialChip}>
            <Text style={styles.trialChipText}>{trialLabel}</Text>
          </View>
        )}
        <View style={styles.rightWrap}>
          <Text style={styles.rightPrimary}>{rightPrimary}</Text>
          <Text style={styles.rightSecondary}>{rightSecondary}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function makeStyles(theme: Theme, selected: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: selected ? 2 : 1,
      borderColor: selected ? theme.accent : theme.cardBorder,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    leftWrap: { flexShrink: 0 },
    title: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: "800",
    },
    period: {
      color: theme.textSecondary,
      fontSize: 13,
      marginTop: 2,
      textDecorationLine: "line-through",
    },
    trialChip: {
      flex: 1,
      alignItems: "center",
    },
    trialChipText: {
      backgroundColor: theme.accent,
      color: theme.accentOn,
      fontSize: 12,
      fontWeight: "700",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      overflow: "hidden",
    },
    rightWrap: {
      alignItems: "flex-end",
      flexShrink: 0,
    },
    rightPrimary: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    rightSecondary: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    saveBadge: {
      position: "absolute",
      top: -10,
      right: 16,
      backgroundColor: "#22c55e",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    saveBadgeText: {
      color: "#ffffff",
      fontSize: 11,
      fontWeight: "800",
    },
  });
}
