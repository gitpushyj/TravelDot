// 누적 visitCounts(전체 기간)로 마일스톤 진행 상태를 평가한다.
// 홈 상단 통계는 연도 필터(activeCounts)를 쓰지만, 마일스톤은 항상 누적이 자연스럽다.

import { CONTINENTS, ContinentId, continentOf } from "../badges/continents";
import { TIER_CUTOFFS, TIERS } from "../travel/tierTitles";
import type { PremiumContext } from "./premium/types";
import {
  ContinentMilestoneId,
  isPremiumMilestoneKind,
  MilestoneKind,
  MilestoneProgress,
  MilestoneUnit,
} from "./milestoneTypes";

/**
 * `evaluateMilestone`에 주입되는 컨텍스트.
 * 무료 마일스톤(countries/days/continent_*)은 `visitCounts`만 참조한다.
 * Premium 마일스톤은 `premiumContext`도 필요하다 — null이면 평가 불가 처리.
 */
export type MilestoneEvalContext = {
  visitCounts: Record<string, number>;
  /**
   * Premium 평가에 필요한 컨텍스트. 무료 사용자(`isAllMilestoneVisible: false`)이거나
   * 아직 로드되지 않았으면 null. Premium kind 평가 시 null이면 진행률 0 placeholder를 반환.
   */
  premiumContext: PremiumContext | null;
};

const DAY_CUTOFFS: readonly number[] = [7, 30, 100, 365, 730, 1000];

const CONTINENT_KIND_TO_ID: Record<ContinentMilestoneId, ContinentId> = {
  continent_AS: "AS",
  continent_EU: "EU",
  continent_SA: "SA",
  continent_AF: "AF",
  continent_NA: "NA",
};

function findNextCutoff(
  cutoffs: readonly number[],
  current: number
): number | null {
  for (const c of cutoffs) {
    if (c > current) return c;
  }
  return null;
}

function buildProgress(
  kind: MilestoneKind,
  current: number,
  next: number | null,
  nextTitleBadgeId: string | null,
  unit: MilestoneUnit
): MilestoneProgress {
  if (next == null) {
    return {
      kind,
      current,
      next: null,
      nextTitleBadgeId: null,
      percent: 100,
      reachedFinal: true,
      unit,
      unsupportedReason: null,
    };
  }
  const percent = Math.round((current / next) * 1000) / 10;
  return {
    kind,
    current,
    next,
    nextTitleBadgeId,
    percent: Math.min(100, percent),
    reachedFinal: false,
    unit,
    unsupportedReason: null,
  };
}

export function evaluateMilestone(
  kind: MilestoneKind,
  ctx: MilestoneEvalContext
): MilestoneProgress {
  const { visitCounts } = ctx;
  if (kind === "countries") {
    const current = Object.keys(visitCounts).length;
    const next = findNextCutoff(TIER_CUTOFFS, current);
    const nextTier = next == null ? null : TIERS.find((t) => t.threshold === next);
    return buildProgress(
      kind,
      current,
      next,
      nextTier ? `tier_${nextTier.id}` : null,
      "countries"
    );
  }
  if (kind === "days") {
    let current = 0;
    for (const c of Object.keys(visitCounts)) current += visitCounts[c] ?? 0;
    const next = findNextCutoff(DAY_CUTOFFS, current);
    return buildProgress(
      kind,
      current,
      next,
      next == null ? null : `days_${next}`,
      "days"
    );
  }
  // 프리미엄 마일스톤은 별도 평가기에서 처리 — 여기서는 미구현 상태를 반환
  if (isPremiumMilestoneKind(kind)) {
    return buildProgress(kind, 0, null, null, "countries");
  }
  // 대륙 마일스톤
  const continentId = CONTINENT_KIND_TO_ID[kind];
  let current = 0;
  for (const code of Object.keys(visitCounts)) {
    if (continentOf(code) === continentId) current += 1;
  }
  const def = CONTINENTS.find((c) => c.id === continentId)!;
  const cutoffs = [def.initiate, def.wanderer, def.conqueror];
  const next = findNextCutoff(cutoffs, current);
  let nextTitleBadgeId: string | null = null;
  if (next != null) {
    if (next === def.initiate) nextTitleBadgeId = `continent_${continentId}_initiate`;
    else if (next === def.wanderer) nextTitleBadgeId = `continent_${continentId}_wanderer`;
    else nextTitleBadgeId = `continent_${continentId}_conqueror`;
  }
  return buildProgress(kind, current, next, nextTitleBadgeId, "countries");
}
