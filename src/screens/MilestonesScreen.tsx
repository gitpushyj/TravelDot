import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { badgeFromId } from "../features/badges/badges";
import { localizedBadgeTitle } from "../features/badges/badgeI18n";
import { COUNTRY_NAME_KO_BY_CODE } from "../features/badges/countryNames";
import { evaluateMilestone } from "../features/milestone/milestoneEvaluator";
import { useMilestoneStore } from "../features/milestone/milestoneStore";
import {
  ALL_MILESTONE_KINDS,
  MilestoneKind,
  MilestoneProgress,
} from "../features/milestone/milestoneTypes";
import { useVisitStore } from "../features/travel/visitStore";
import { getCurrentLocale } from "../i18n";
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
      ALL_MILESTONE_KINDS.map((k) => {
        const progress = evaluateMilestone(k, visitCounts);
        return {
          kind: k,
          label: t(`milestones.option.${k}`),
          progress,
          activeDescription: buildActiveDescription(progress, t),
        };
      }),
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
            activeDescription={row.activeDescription}
            onPress={() => handlePick(row.kind)}
          />
        ))}
        <Text style={styles.footnote}>{t("milestones.footnote")}</Text>
      </ScrollView>
    </View>
  );
}

function buildActiveDescription(
  progress: MilestoneProgress,
  t: ReturnType<typeof useTranslation>["t"]
): string {
  if (progress.reachedFinal) {
    return t("milestones.activeNext.completed");
  }
  const next = progress.next;
  const badgeId = progress.nextTitleBadgeId;
  if (next == null || badgeId == null) return "";
  const badge = badgeFromId(badgeId, COUNTRY_NAME_KO_BY_CODE);
  const title = badge ? localizedBadgeTitle(badge, t, getCurrentLocale()) : "";
  const key =
    progress.unit === "days"
      ? "milestones.activeNext.days"
      : "milestones.activeNext.countries";
  return t(key, { count: next, title });
}
