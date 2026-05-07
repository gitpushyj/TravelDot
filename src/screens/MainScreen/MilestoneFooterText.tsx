import { Text, type TextStyle, type StyleProp } from "react-native";
import { useTranslation } from "react-i18next";

import type { MilestoneProgress } from "../../features/milestone/milestoneTypes";

// 호칭명 위치를 분리하기 위한 placeholder. 일반 텍스트와 충돌하지 않도록 NUL을 사용.
const TITLE_MARKER = "\x00__TITLE__\x00";

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

  if (progress.reachedFinal) {
    return <>{t("home.milestoneFooter.completed")}</>;
  }

  const remaining = (progress.next ?? 0) - progress.current;
  const key =
    progress.unit === "days"
      ? "home.milestoneFooter.days"
      : "home.milestoneFooter.countries";
  const message = t(key, { count: remaining, title: TITLE_MARKER });
  const [pre, post = ""] = message.split(TITLE_MARKER);

  return (
    <>
      {pre}
      <Text style={strongStyle}>{nextTitleLabel}</Text>
      {post}
    </>
  );
}
