import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";
import { FLAG_COLORS_BY_CODE } from "../../../badges/data";

export function evaluateFlagPalette(ctx: PremiumContext): BadgeDefinition[] {
  const colors = new Set<string>();
  for (const code of ctx.visitedCountryCodes) {
    const cs = FLAG_COLORS_BY_CODE[code] ?? [];
    for (const c of cs) colors.add(c);
  }
  const out: BadgeDefinition[] = [];
  if (colors.size >= 5) {
    out.push({
      id: "premium_flag_palette_5",
      category: "premium_culture",
      titleKo: "색의 수집가",
      titleEn: "Color Collector",
      description: "방문국 국기에서 5색 수집",
      emoji: "🎨",
      rank: 73,
    });
  }
  if (colors.size >= 7) {
    out.push({
      id: "premium_flag_palette_7",
      category: "premium_culture",
      titleKo: "팔레트 마스터",
      titleEn: "Flag Palette Master",
      description: "방문국 국기에서 7색 모두 수집",
      emoji: "🌈",
      rank: 74,
    });
  }
  return out;
}
