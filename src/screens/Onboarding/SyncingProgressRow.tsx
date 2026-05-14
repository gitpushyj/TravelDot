import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";

import type { Theme } from "../../theme/theme";

import SyncingActiveDots from "./SyncingActiveDots";

export type RowState = "done" | "active" | "pending";

type Props = {
  theme: Theme;
  Icon: React.ComponentType<{ size?: number; color: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
  state: RowState;
  // active 상태일 때 desc 아래에 진행률을 표시한다. total이 0이면 카운트만 보여주고,
  // total이 양수면 "N / total (P%)" 형식으로 표시한다.
  progress?: { processed: number; total: number } | null;
};

export default function SyncingProgressRow({
  theme,
  Icon,
  iconColor,
  iconBg,
  title,
  desc,
  state,
  progress,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon size={22} color={iconColor} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.desc, { color: theme.textSecondary }]}>{desc}</Text>
        {state === "active" && progress && (
          <Text
            style={[styles.progress, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {progress.processed === 0
              ? t("onboarding.sync.scanningPlaceholder")
              : formatProgress(progress)}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.statusWrap,
          {
            backgroundColor:
              state === "active" ? theme.accent : theme.accentSoftBg,
          },
        ]}
      >
        {state === "done" ? (
          <CheckIcon color={theme.accent} />
        ) : state === "active" ? (
          <SyncingActiveDots color="#ffffff" />
        ) : (
          <View style={[styles.pendingDot, { borderColor: theme.textMuted }]} />
        )}
      </View>
    </View>
  );
}

function formatProgress({
  processed,
  total,
}: {
  processed: number;
  total: number;
}): string {
  const p = processed.toLocaleString();
  if (total <= 0) return p;
  const pct = Math.min(100, Math.floor((processed / total) * 100));
  return `${p} / ${total.toLocaleString()} (${pct}%)`;
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5l5 5 9-11"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  desc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  progress: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  statusWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
