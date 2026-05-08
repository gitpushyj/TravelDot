import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";
import { ageAtTimestamp } from "../ageUtils";

type Stage = { id: string; min: number; max: number; n: number; emoji: string };
const STAGES: Stage[] = [
  { id: "10s", min: 10, max: 19, n: 5, emoji: "🌱" },
  { id: "20s", min: 20, max: 29, n: 15, emoji: "🌟" },
  { id: "30s", min: 30, max: 39, n: 25, emoji: "🎒" },
  { id: "40s", min: 40, max: 49, n: 25, emoji: "🧭" },
  { id: "50plus", min: 50, max: 999, n: 15, emoji: "🌅" },
];

export function evaluateDecadeStamps(ctx: PremiumContext): BadgeDefinition[] {
  if (!ctx.birth) return [];
  const out: BadgeDefinition[] = [];
  for (const s of STAGES) {
    const codes = new Set<string>();
    for (const p of ctx.photos) {
      const age = ageAtTimestamp(p.takenAtMs, ctx.birth);
      if (age >= s.min && age <= s.max) codes.add(p.countryCode);
    }
    if (codes.size >= s.n) {
      out.push({
        id: `premium_decade_${s.id}`,
        category: "premium_age",
        titleKo: `${s.id} 컬렉터`,
        titleEn: `Decade ${s.id}`,
        description: `${s.id} 시기에 ${s.n}개국 방문`,
        emoji: s.emoji,
        rank: 65,
      });
    }
  }
  return out;
}
