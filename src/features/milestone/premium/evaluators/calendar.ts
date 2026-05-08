import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";

export function evaluateCalendar(ctx: PremiumContext): BadgeDefinition[] {
  const months = new Set<number>();
  for (const p of ctx.photos) {
    if (ctx.homeCountry && p.countryCode === ctx.homeCountry) continue;
    months.add(new Date(p.takenAtMs).getMonth() + 1);
  }
  const out: BadgeDefinition[] = [];
  if (months.size >= 6) {
    out.push({
      id: "premium_calendar_6",
      category: "premium_time",
      titleKo: "반년의 여행자",
      titleEn: "Half-Year Drifter",
      description: "12개월 중 6개월에 해외 사진",
      emoji: "📅",
      rank: 71,
    });
  }
  if (months.size >= 12) {
    out.push({
      id: "premium_calendar_12",
      category: "premium_time",
      titleKo: "달력의 여행자",
      titleEn: "Calendar Drifter",
      description: "12개월 모두 해외 사진",
      emoji: "🗓️",
      rank: 72,
    });
  }
  return out;
}
