import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";
import { UTC_OFFSET_BY_CODE } from "../../../badges/data";

export function evaluateRoundTheClock(ctx: PremiumContext): BadgeDefinition[] {
  let min = +Infinity;
  let max = -Infinity;
  for (const code of ctx.visitedCountryCodes) {
    const off = UTC_OFFSET_BY_CODE[code];
    if (off == null) continue;
    if (off < min) min = off;
    if (off > max) max = off;
  }
  if (max - min >= 24) {
    return [{
      id: "premium_round_the_clock",
      category: "premium_special",
      titleKo: "지구 한 바퀴",
      titleEn: "Round the Clock",
      description: "시차 24시간 이상 차이의 두 국가 모두 방문",
      emoji: "🕛",
      rank: 85,
    }];
  }
  return [];
}
