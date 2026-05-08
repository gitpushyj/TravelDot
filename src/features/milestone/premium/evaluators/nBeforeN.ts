import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";
import { ageAtTimestamp } from "../ageUtils";

const STAGES: { ageBefore: number; n: number }[] = [
  { ageBefore: 20, n: 5 },
  { ageBefore: 25, n: 10 },
  { ageBefore: 30, n: 20 },
  { ageBefore: 40, n: 30 },
  { ageBefore: 50, n: 50 },
];

export function evaluateNBeforeN(ctx: PremiumContext): BadgeDefinition[] {
  if (!ctx.birth) return [];
  const out: BadgeDefinition[] = [];
  for (const s of STAGES) {
    const codes = new Set<string>();
    for (const p of ctx.photos) {
      const age = ageAtTimestamp(p.takenAtMs, ctx.birth);
      if (age >= 0 && age < s.ageBefore) codes.add(p.countryCode);
    }
    if (codes.size >= s.n) {
      out.push({
        id: `premium_n_before_n_${s.n}_${s.ageBefore}`,
        category: "premium_age",
        titleKo: `${s.n} Before ${s.ageBefore}`,
        titleEn: `${s.n} Before ${s.ageBefore}`,
        description: `만 ${s.ageBefore}세 전에 ${s.n}개국 방문`,
        emoji: "🏃",
        rank: 60 + s.n / 10,
      });
    }
  }
  return out;
}
