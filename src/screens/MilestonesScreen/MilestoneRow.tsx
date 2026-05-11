import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { Trans, useTranslation } from "react-i18next";

import type {
  MilestoneProgress,
  MilestoneUnit,
} from "../../features/milestone/milestoneTypes";
import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

/**
 * 활성 row 아래에 펼쳐 보여줄 다음 호칭 안내.
 * - completed: 최고 단계 도달
 * - needsHomeCountry: 평가에 필요한 사용자 데이터 부재
 * - next: 다음 컷오프까지의 안내 (호칭 이름은 굵게)
 */
export type ActiveDescription =
  | { kind: "completed" }
  | { kind: "needsHomeCountry" }
  | {
      kind: "next";
      count: number;
      title: string;
      unit: MilestoneUnit;
    };

const UNIT_I18N_KEY: Record<MilestoneUnit, string> = {
  countries: "home.countriesUnit",
  days: "home.daysUnit",
  months: "home.monthsUnit",
  colors: "home.colorsUnit",
  languages: "home.languagesUnit",
  percent: "home.percentUnit",
  hours: "home.hoursUnit",
};

const ACTIVE_NEXT_I18N_KEY: Record<MilestoneUnit, string> = {
  countries: "milestones.activeNext.countries",
  days: "milestones.activeNext.days",
  months: "milestones.activeNext.months",
  colors: "milestones.activeNext.colors",
  languages: "milestones.activeNext.languages",
  percent: "milestones.activeNext.percent",
  hours: "milestones.activeNext.hours",
};

type Props = {
  theme: Theme;
  label: string;
  progress: MilestoneProgress;
  active: boolean;
  activeDescription: ActiveDescription | null;
  onPress: () => void;
};

export default function MilestoneRow({
  theme,
  label,
  progress,
  active,
  activeDescription,
  onPress,
}: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const progressText = progress.unsupportedReason
    ? "—"
    : progress.reachedFinal
      ? t("milestones.preview.completed")
      : t("milestones.preview.progress", {
          current: progress.current,
          next: progress.next,
          unit: t(UNIT_I18N_KEY[progress.unit]),
        });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        active && styles.rowActive,
        pressed && !active && { opacity: 0.85 },
      ]}
    >
      <View style={styles.rowTopLine}>
        <View style={[styles.radio, active && styles.radioActive]}>
          {active ? <View style={styles.radioDot} /> : null}
        </View>
        <View style={styles.rowMain}>
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <Text
          style={[
            styles.rowProgress,
            progress.reachedFinal && styles.rowProgressDone,
          ]}
        >
          {progressText}
        </Text>
      </View>
      {active && activeDescription
        ? renderDescription(activeDescription, styles)
        : null}
    </Pressable>
  );
}

// 외부 Text 한 개 안에서 Trans 또는 단일 텍스트를 렌더한다.
// numberOfLines를 지정하지 않으므로 언어가 길어지면 자연스럽게 두 줄 이상으로 wrap된다.
function renderDescription(
  desc: ActiveDescription,
  styles: ReturnType<typeof makeStyles>
) {
  if (desc.kind === "completed") {
    return (
      <Text style={[styles.rowDescription, styles.rowDescriptionDone]}>
        <Trans i18nKey="milestones.activeNext.completed" />
      </Text>
    );
  }
  if (desc.kind === "needsHomeCountry") {
    return (
      <Text style={styles.rowDescription}>
        <Trans i18nKey="milestones.activeNext.needsHomeCountry" />
      </Text>
    );
  }
  // desc.kind === "next"
  return (
    <Text style={styles.rowDescription}>
      <Trans
        i18nKey={ACTIVE_NEXT_I18N_KEY[desc.unit]}
        values={{ count: desc.count, title: desc.title }}
        components={{ b: <Text style={styles.rowDescriptionBold} /> }}
      />
    </Text>
  );
}
