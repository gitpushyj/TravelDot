import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";

const STAGES: { id: string; mul: number; emoji: string }[] = [
  { id: "x1", mul: 1, emoji: "🎂" },
  { id: "x1_5", mul: 1.5, emoji: "🎉" },
  { id: "x2", mul: 2, emoji: "🌠" },
];

export function evaluateAgeMatch(ctx: PremiumContext): BadgeDefinition[] {
  if (!ctx.birth || ctx.currentAge == null) return [];
  const visited = ctx.visitedCountriesCount;
  const age = ctx.currentAge;
  const out: BadgeDefinition[] = [];
  for (const s of STAGES) {
    if (visited >= Math.ceil(age * s.mul)) {
      out.push({
        id: `premium_age_match_${s.id}`,
        category: "premium_age",
        titleKo: `Age ${s.id}`,
        titleEn: `Age Match ${s.id}`,
        description: `현재 만 나이 × ${s.mul} 이상의 방문국`,
        emoji: s.emoji,
        rank: 62,
      });
    }
  }
  return out;
}
