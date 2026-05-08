import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext, Season } from "../types";

function seasonOfMonth(month1to12: number): Season {
  if (month1to12 >= 3 && month1to12 <= 5) return "spring";
  if (month1to12 >= 6 && month1to12 <= 8) return "summer";
  if (month1to12 >= 9 && month1to12 <= 11) return "autumn";
  return "winter";
}

export function evaluateFourSeasons(ctx: PremiumContext): BadgeDefinition[] {
  const byCountry = new Map<string, Set<Season>>();
  for (const p of ctx.photos) {
    if (ctx.homeCountry && p.countryCode === ctx.homeCountry) continue;
    const m = new Date(p.takenAtMs).getMonth() + 1;
    const set = byCountry.get(p.countryCode) ?? new Set<Season>();
    set.add(seasonOfMonth(m));
    byCountry.set(p.countryCode, set);
  }
  const out: BadgeDefinition[] = [];
  for (const [code, seasons] of byCountry) {
    if (seasons.size === 4) {
      out.push({
        id: `premium_four_seasons_${code}`,
        category: "premium_time",
        titleKo: `${code} 사계절`,
        titleEn: `${code} Four Seasons`,
        description: `${code} 한 국가에서 4계절 모두 사진을 남김`,
        emoji: "🌸",
        rank: 70,
      });
    }
  }
  return out;
}
