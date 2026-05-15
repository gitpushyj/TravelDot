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

// kind에 따라 푸터 i18n 키를 결정한다.
// 대륙별·인구 비율·면적 비율은 같은 unit을 공유하지만 "무엇에 대한 진행인지"
// 사용자가 한눈에 알 수 있도록 별도 메시지를 쓴다.
function footerKeyFor(progress: MilestoneProgress): string {
  const { kind, unit } = progress;
  if (typeof kind === "string" && kind.startsWith("continent_")) {
    return "home.milestoneFooter.continentCountries";
  }
  if (kind === "premium_humanity") return "home.milestoneFooter.humanityPercent";
  if (kind === "premium_earth_area") return "home.milestoneFooter.earthPercent";
  return `home.milestoneFooter.${unit}`;
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
  const params: Record<string, string | number> = {
    count: remaining,
    title: TITLE_MARKER,
  };
  if (typeof progress.kind === "string" && progress.kind.startsWith("continent_")) {
    const continentId = progress.kind.slice("continent_".length);
    params.continent = t(`badges.continent.name.${continentId}`);
  }
  const message = t(footerKeyFor(progress), params);
  const [pre, post = ""] = message.split(TITLE_MARKER);

  return (
    <>
      {pre}
      <Text style={strongStyle}>{nextTitleLabel}</Text>
      {post}
    </>
  );
}
