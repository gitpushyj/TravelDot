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
 * 단계 1에서 대표 마일스톤 후보로 노출하는 7종.
 * 단계가 명확한 누적형으로, 기존 MilestoneRow와 동일한 진행률·다음 호칭 UX 적용.
 */
export const SELECTABLE_PREMIUM_KINDS: readonly MilestoneKind[] = [
  "premium_humanity",
  "premium_earth_area",
  "premium_calendar",
  "premium_flag_palette",
  "premium_un_linguist",
  "premium_age_match",
  "premium_round_the_clock",
];

/**
 * 단계 1에서는 카드 형태로만 표시하는 3종.
 * 시간 의존(`n_before_n`, `decade_stamps`)과 동적(`four_seasons`).
 * 호칭은 자동 부여되지만 대표 마일스톤으로는 선택 불가.
 */
const INFO_ONLY_PREMIUM_KINDS = ALL_PREMIUM_MILESTONE_KINDS.filter(
  (k) => !SELECTABLE_PREMIUM_KINDS.includes(k as MilestoneKind)
);

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
 * 선택 가능한 7종은 MilestoneRow로, 정보 카드 3종은 캡션과 함께 표시.
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
      {INFO_ONLY_PREMIUM_KINDS.map((id) => (
        <View key={id} style={styles.premiumCard}>
          <Text style={styles.premiumIcon}>
            {t(`milestones.premium.items.${id}.icon`)}
          </Text>
          <View style={styles.premiumTextCol}>
            <Text style={styles.premiumName}>
              {t(`milestones.premium.items.${id}.name`)}
            </Text>
            <Text style={styles.premiumDescription}>
              {t(`milestones.premium.items.${id}.description`)}
            </Text>
            <Text style={styles.premiumDescription}>
              {t("milestones.premium.subsectionUnsupported")}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
