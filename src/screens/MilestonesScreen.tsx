import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { evaluateMilestone } from "../features/milestone/milestoneEvaluator";
import { useMilestoneStore } from "../features/milestone/milestoneStore";
import {
  ALL_MILESTONE_KINDS,
  MilestoneKind,
} from "../features/milestone/milestoneTypes";
import { useVisitStore } from "../features/travel/visitStore";
import { useTheme } from "../theme/themeStore";

import MilestoneRow from "./MilestonesScreen/MilestoneRow";
import { makeStyles } from "./MilestonesScreen/styles";

type Props = {
  onClose: () => void;
  onOpenTitles: () => void;
};

export default function MilestonesScreen({ onClose, onOpenTitles }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const kind = useMilestoneStore((s) => s.kind);
  const setKind = useMilestoneStore((s) => s.setKind);
  const visitCounts = useVisitStore((s) => s.visitCounts);

  const rows = useMemo(
    () =>
      ALL_MILESTONE_KINDS.map((k) => ({
        kind: k,
        label: t(`milestones.option.${k}`),
        progress: evaluateMilestone(k, visitCounts),
      })),
    [t, visitCounts]
  );

  const handlePick = (k: MilestoneKind) => {
    if (k === kind) return;
    void setKind(k);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.headerSide}>
          <Text style={styles.cancel}>{t("common.close")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("milestones.heading")}</Text>
        <Pressable onPress={onOpenTitles} hitSlop={8} style={styles.headerSide}>
          <Text style={styles.quickLink}>{t("milestones.gotoTitles")} ›</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {rows.map((row) => (
          <MilestoneRow
            key={row.kind}
            theme={theme}
            label={row.label}
            progress={row.progress}
            active={kind === row.kind}
            onPress={() => handlePick(row.kind)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
