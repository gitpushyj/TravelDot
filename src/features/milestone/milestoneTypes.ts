// src/features/milestone/milestoneTypes.ts
// 사용자가 홈 화면에서 추적할 "목표 마일스톤" 도메인 타입.
// 종류는 7개 — 국가 수 / 누적 일수 / 5개 대륙 전문가.
// 호칭(Badge) 시스템과 독립적으로 진행률만 다룬다.

export type ContinentMilestoneId =
  | "continent_AS"
  | "continent_EU"
  | "continent_SA"
  | "continent_AF"
  | "continent_NA";

export type PremiumMilestoneId =
  | "premium_calendar"
  | "premium_flag_palette"
  | "premium_un_linguist"
  | "premium_humanity"
  | "premium_earth_area"
  | "premium_round_the_clock";

export type MilestoneKind =
  | "countries"
  | "days"
  | ContinentMilestoneId
  | PremiumMilestoneId;

export const ALL_MILESTONE_KINDS: readonly MilestoneKind[] = [
  "countries",
  "days",
  "continent_AS",
  "continent_EU",
  "continent_SA",
  "continent_AF",
  "continent_NA",
];

export const ALL_PREMIUM_MILESTONE_KINDS: readonly PremiumMilestoneId[] = [
  "premium_calendar",
  "premium_flag_palette",
  "premium_un_linguist",
  "premium_humanity",
  "premium_earth_area",
  "premium_round_the_clock",
];

export function isPremiumMilestoneKind(v: unknown): v is PremiumMilestoneId {
  return (
    typeof v === "string" &&
    (ALL_PREMIUM_MILESTONE_KINDS as readonly string[]).includes(v)
  );
}

export const DEFAULT_MILESTONE_KIND: MilestoneKind = "countries";

export type MilestoneUnit =
  | "countries"
  | "days"
  | "months"
  | "colors"
  | "languages"
  | "percent"
  | "hours";

export type MilestoneUnsupportedReason = "needs_home_country";

/** UI에서 진행률·다음 단계를 그리기 위한 평가 결과 */
export type MilestoneProgress = {
  kind: MilestoneKind;
  /** 현재 값 (방문 국가 수 / 누적 일수 / 해당 대륙 방문 국가 수 / 그 외 단위별 수치) */
  current: number;
  /** 다음 단계 컷오프. 최종 단계 도달 시 null */
  next: number | null;
  /** 다음 단계에서 부여될 호칭의 BadgeId. 최종 단계면 null */
  nextTitleBadgeId: string | null;
  /** 진행률 0~100. 최종 단계는 100 고정 */
  percent: number;
  /** true면 최종 단계 도달 — UI는 "최고 단계 달성" 표시 */
  reachedFinal: boolean;
  /** 푸터 라벨 단위 분기용 */
  unit: MilestoneUnit;
  /**
   * 평가에 필요한 사용자 데이터가 없을 때 사유. UI가 진행률 대신 안내 문구로 분기.
   * null이면 정상 평가 결과 (현재 진행률을 그대로 표시).
   */
  unsupportedReason: MilestoneUnsupportedReason | null;
};

export function isMilestoneKind(value: unknown): value is MilestoneKind {
  return (
    typeof value === "string" &&
    ((ALL_MILESTONE_KINDS as readonly string[]).includes(value) ||
      (ALL_PREMIUM_MILESTONE_KINDS as readonly string[]).includes(value))
  );
}
