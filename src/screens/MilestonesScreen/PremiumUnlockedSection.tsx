import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  ALL_PREMIUM_MILESTONE_KINDS,
  MilestoneKind,
  MilestoneProgress,
} from "../../features/milestone/milestoneTypes";
import type { Theme } from "../../theme/theme";

import MilestoneRow, { ActiveDescription } from "./MilestoneRow";
import type { makeStyles } from "./styles";

/**
 * 대표 마일스톤 후보로 노출하는 premium 7종.
 * `ALL_PREMIUM_MILESTONE_KINDS`와 동일하지만, 외부에서 명시적으로 import해
 * 사용 의도를 분명히 한다.
 */
export const SELECTABLE_PREMIUM_KINDS: readonly MilestoneKind[] =
  ALL_PREMIUM_MILESTONE_KINDS;

export type PremiumRowData = {
  kind: MilestoneKind;
  label: string;
  progress: MilestoneProgress;
  activeDescription: ActiveDescription | null;
};

type Props = {
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
  selectedKind: MilestoneKind;
  /** SELECTABLE_PREMIUM_KINDS 순서로 빌드된 row 데이터 (외부에서 evaluateMilestone 결과로 채움). */
  rows: PremiumRowData[];
  onPick: (k: MilestoneKind) => void;
};

/**
 * 유료 사용자에게 보여주는 Premium 마일스톤 섹션.
 * 7종 모두 MilestoneRow로 선택 가능하게 표시.
 */
export default function PremiumUnlockedSection({
  theme,
  styles,
  selectedKind,
  rows,
  onPick,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.premiumSection}>
      <View style={styles.premiumHeader}>
        <Text style={styles.premiumTitle}>
          {t("milestones.premium.sectionTitle")} ({ALL_PREMIUM_MILESTONE_KINDS.length})
        </Text>
      </View>
      {rows.map((row) => (
        <MilestoneRow
          key={row.kind}
          theme={theme}
          label={row.label}
          progress={row.progress}
          active={selectedKind === row.kind}
          activeDescription={row.activeDescription}
          onPress={() => onPick(row.kind)}
        />
      ))}
    </View>
  );
}
