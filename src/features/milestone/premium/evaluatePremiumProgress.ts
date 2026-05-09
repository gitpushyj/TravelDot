import {
  POPULATION_BY_CODE,
  WORLD_POPULATION,
  AREA_BY_CODE,
  EARTH_LAND_AREA_KM2,
  FLAG_COLORS_BY_CODE,
  OFFICIAL_LANGUAGES_BY_CODE,
  UTC_OFFSET_BY_CODE,
} from "../../badges/data";
import type {
  MilestoneProgress,
  MilestoneUnit,
  PremiumMilestoneId,
} from "../milestoneTypes";
import type { PremiumContext } from "./types";

type CutoffStage = { cutoff: number; badgeId: string };

/**
 * 단계 컷오프 배열을 받아 `current` 값에 해당하는 다음 단계 진행률을 만든다.
 * 모든 컷오프를 통과했으면 `reachedFinal: true`.
 */
function fromStages(
  kind: PremiumMilestoneId,
  current: number,
  stages: CutoffStage[],
  unit: MilestoneUnit
): MilestoneProgress {
  const next = stages.find((s) => current < s.cutoff);
  if (!next) {
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
  const percent = Math.min(100, Math.round((current / next.cutoff) * 1000) / 10);
  return {
    kind,
    current,
    next: next.cutoff,
    nextTitleBadgeId: next.badgeId,
    percent,
    reachedFinal: false,
    unit,
    unsupportedReason: null,
  };
}

function evaluateHumanity(ctx: PremiumContext): MilestoneProgress {
  let pop = 0;
  for (const code of ctx.visitedCountryCodes) {
    pop += POPULATION_BY_CODE[code] ?? 0;
  }
  const current = Math.floor((pop / WORLD_POPULATION) * 100);
  return fromStages(
    "premium_humanity",
    current,
    [
      { cutoff: 25, badgeId: "premium_humanity_25" },
      { cutoff: 50, badgeId: "premium_humanity_50" },
      { cutoff: 75, badgeId: "premium_humanity_75" },
    ],
    "percent"
  );
}

function evaluateEarthArea(ctx: PremiumContext): MilestoneProgress {
  let area = 0;
  for (const code of ctx.visitedCountryCodes) {
    area += AREA_BY_CODE[code] ?? 0;
  }
  const current = Math.floor((area / EARTH_LAND_AREA_KM2) * 100);
  return fromStages(
    "premium_earth_area",
    current,
    [
      { cutoff: 25, badgeId: "premium_earth_25" },
      { cutoff: 50, badgeId: "premium_earth_50" },
      { cutoff: 75, badgeId: "premium_earth_75" },
    ],
    "percent"
  );
}

function evaluateCalendar(ctx: PremiumContext): MilestoneProgress {
  if (!ctx.homeCountry) {
    return {
      kind: "premium_calendar",
      current: 0,
      next: null,
      nextTitleBadgeId: null,
      percent: 0,
      reachedFinal: false,
      unit: "months",
      unsupportedReason: "needs_home_country",
    };
  }
  const months = new Set<number>();
  for (const p of ctx.photos) {
    if (p.countryCode === ctx.homeCountry) continue;
    months.add(new Date(p.takenAtMs).getMonth() + 1);
  }
  return fromStages(
    "premium_calendar",
    months.size,
    [
      { cutoff: 6, badgeId: "premium_calendar_6" },
      { cutoff: 12, badgeId: "premium_calendar_12" },
    ],
    "months"
  );
}

function evaluateFlagPalette(ctx: PremiumContext): MilestoneProgress {
  const colors = new Set<string>();
  for (const code of ctx.visitedCountryCodes) {
    for (const c of FLAG_COLORS_BY_CODE[code] ?? []) colors.add(c);
  }
  return fromStages(
    "premium_flag_palette",
    colors.size,
    [
      { cutoff: 5, badgeId: "premium_flag_palette_5" },
      { cutoff: 7, badgeId: "premium_flag_palette_7" },
    ],
    "colors"
  );
}

function evaluateUnLinguist(ctx: PremiumContext): MilestoneProgress {
  const langs = new Set<string>();
  for (const code of ctx.visitedCountryCodes) {
    for (const l of OFFICIAL_LANGUAGES_BY_CODE[code] ?? []) langs.add(l);
  }
  return fromStages(
    "premium_un_linguist",
    langs.size,
    [
      { cutoff: 3, badgeId: "premium_un_linguist_3" },
      { cutoff: 6, badgeId: "premium_un_linguist_6" },
    ],
    "languages"
  );
}

function evaluateAgeMatch(ctx: PremiumContext): MilestoneProgress {
  if (ctx.currentAge == null) {
    return {
      kind: "premium_age_match",
      current: 0,
      next: null,
      nextTitleBadgeId: null,
      percent: 0,
      reachedFinal: false,
      unit: "countries",
      unsupportedReason: "needs_birth",
    };
  }
  const age = ctx.currentAge;
  return fromStages(
    "premium_age_match",
    ctx.visitedCountryCodes.length,
    [
      { cutoff: Math.round(age * 1), badgeId: "premium_age_match_x1" },
      { cutoff: Math.round(age * 1.5), badgeId: "premium_age_match_x1_5" },
      { cutoff: Math.round(age * 2), badgeId: "premium_age_match_x2" },
    ],
    "countries"
  );
}

function evaluateRoundTheClock(ctx: PremiumContext): MilestoneProgress {
  let min = +Infinity;
  let max = -Infinity;
  for (const code of ctx.visitedCountryCodes) {
    const off = UTC_OFFSET_BY_CODE[code];
    if (off == null) continue;
    if (off < min) min = off;
    if (off > max) max = off;
  }
  const current = max === -Infinity || min === +Infinity ? 0 : Math.max(0, max - min);
  return fromStages(
    "premium_round_the_clock",
    current,
    [{ cutoff: 24, badgeId: "premium_round_the_clock" }],
    "hours"
  );
}

/**
 * Premium 마일스톤 진행률 평가의 단일 진입점.
 * `PremiumMilestoneId`가 7종으로 닫혀 있어 switch가 exhaustive — 새 kind 추가 시
 * 컴파일 에러로 누락 검출 가능.
 */
export function evaluatePremiumProgress(
  kind: PremiumMilestoneId,
  ctx: PremiumContext
): MilestoneProgress {
  switch (kind) {
    case "premium_humanity":
      return evaluateHumanity(ctx);
    case "premium_earth_area":
      return evaluateEarthArea(ctx);
    case "premium_calendar":
      return evaluateCalendar(ctx);
    case "premium_flag_palette":
      return evaluateFlagPalette(ctx);
    case "premium_un_linguist":
      return evaluateUnLinguist(ctx);
    case "premium_age_match":
      return evaluateAgeMatch(ctx);
    case "premium_round_the_clock":
      return evaluateRoundTheClock(ctx);
  }
}
