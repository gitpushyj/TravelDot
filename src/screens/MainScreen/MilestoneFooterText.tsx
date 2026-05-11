import { Text, type TextStyle, type StyleProp } from "react-native";
import { useTranslation } from "react-i18next";

import type {
  MilestoneProgress,
  MilestoneUnit,
} from "../../features/milestone/milestoneTypes";

// 호칭명 위치를 분리하기 위한 placeholder. 일반 텍스트와 충돌하지 않도록 NUL을 사용.
const TITLE_MARKER = "\x00__TITLE__\x00";

const FOOTER_KEY: Record<MilestoneUnit, string> = {
  countries: "home.milestoneFooter.countries",
  days: "home.milestoneFooter.days",
  months: "home.milestoneFooter.months",
  colors: "home.milestoneFooter.colors",
  languages: "home.milestoneFooter.languages",
  percent: "home.milestoneFooter.percent",
  hours: "home.milestoneFooter.hours",
};

interface Props {
  progress: MilestoneProgress;
  nextTitleLabel: string;
  strongStyle: StyleProp<TextStyle>;
}

export function MilestoneFooterText({
  progress,
  nextTitleLabel,
  strongStyle,
}: Props) {
  const { t } = useTranslation();

  if (progress.unsupportedReason === "needs_home_country") {
    return <>{t("home.milestoneFooter.needsHomeCountry")}</>;
  }
  if (progress.reachedFinal) {
    return <>{t("home.milestoneFooter.completed")}</>;
  }

  const remaining = (progress.next ?? 0) - progress.current;
  const message = t(FOOTER_KEY[progress.unit], {
    count: remaining,
    title: TITLE_MARKER,
  });
  const [pre, post = ""] = message.split(TITLE_MARKER);

  return (
    <>
      {pre}
      <Text style={strongStyle}>{nextTitleLabel}</Text>
      {post}
    </>
  );
}
