import React from "react";
import { StyleSheet, View } from "react-native";

import type { Theme } from "../../theme/theme";

import SyncingProgressRow, { type RowState } from "./SyncingProgressRow";
import {
  BrushMapIcon,
  CalendarMetaIcon,
  PinTripIcon,
} from "./syncingPhaseIcons";

type Phase = "scanning" | "saving" | "verifying" | undefined;

type StepLabel = { title: string; desc: string };

type Props = {
  theme: Theme;
  phase: Phase;
  step1: StepLabel;
  step2: StepLabel;
  step3: StepLabel;
};

const META_BG = "rgba(255,107,53,0.14)";
const META_FG = "#ff6b35";
const TRIP_BG = "rgba(34,197,94,0.14)";
const TRIP_FG = "#22c55e";
const MAP_BG = "rgba(139,92,246,0.16)";
const MAP_FG = "#8b5cf6";

// scanning → step 1 active, saving → step 2 active, verifying → step 3 active.
// phase가 아직 정의되기 전이면 step 1을 active로 둔다 (스캔 시작 직전 짧은 idle 구간 포함).
function stateForStep(phase: Phase, step: 1 | 2 | 3): RowState {
  const order = { scanning: 1, saving: 2, verifying: 3 } as const;
  const current = phase ? order[phase] : 1;
  if (step < current) return "done";
  if (step === current) return "active";
  return "pending";
}

export default function SyncingProgressCard({
  theme,
  phase,
  step1,
  step2,
  step3,
}: Props) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
      ]}
    >
      <SyncingProgressRow
        theme={theme}
        Icon={CalendarMetaIcon}
        iconBg={META_BG}
        iconColor={META_FG}
        title={step1.title}
        desc={step1.desc}
        state={stateForStep(phase, 1)}
      />
      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
      <SyncingProgressRow
        theme={theme}
        Icon={PinTripIcon}
        iconBg={TRIP_BG}
        iconColor={TRIP_FG}
        title={step2.title}
        desc={step2.desc}
        state={stateForStep(phase, 2)}
      />
      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
      <SyncingProgressRow
        theme={theme}
        Icon={BrushMapIcon}
        iconBg={MAP_BG}
        iconColor={MAP_FG}
        title={step3.title}
        desc={step3.desc}
        state={stateForStep(phase, 3)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  divider: {
    height: 1,
  },
});
