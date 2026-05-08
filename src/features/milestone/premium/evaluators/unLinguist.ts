import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";
import { OFFICIAL_LANGUAGES_BY_CODE } from "../../../badges/data";

export function evaluateUnLinguist(ctx: PremiumContext): BadgeDefinition[] {
  const langs = new Set<string>();
  for (const code of ctx.visitedCountryCodes) {
    for (const l of OFFICIAL_LANGUAGES_BY_CODE[code] ?? []) langs.add(l);
  }
  const out: BadgeDefinition[] = [];
  if (langs.size >= 3) {
    out.push({
      id: "premium_un_linguist_3",
      category: "premium_culture",
      titleKo: "3개 국어의 여행자",
      titleEn: "Trilingual Traveler",
      description: "UN 6공용어 중 3개를 공용어로 쓰는 국가 방문",
      emoji: "🗣️",
      rank: 75,
    });
  }
  if (langs.size >= 6) {
    out.push({
      id: "premium_un_linguist_6",
      category: "premium_culture",
      titleKo: "UN 공용어 정복자",
      titleEn: "UN Linguist",
      description: "UN 6공용어 모두 — 영·중·스페인·프랑스·러시아·아랍",
      emoji: "🌐",
      rank: 76,
    });
  }
  return out;
}
