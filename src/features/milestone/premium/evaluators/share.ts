import type { BadgeDefinition } from "../../../badges/badges";
import type { PremiumContext } from "../types";
import {
  POPULATION_BY_CODE,
  AREA_BY_CODE,
  WORLD_POPULATION,
  EARTH_LAND_AREA_KM2,
} from "../../../badges/data";

const SHARE_STAGES = [0.25, 0.5, 0.75];

function tierKo(pct: number): string {
  if (pct === 0.25) return "4분의 1";
  if (pct === 0.5) return "절반";
  return "4분의 3";
}
function tierEn(pct: number): string {
  if (pct === 0.25) return "Quarter";
  if (pct === 0.5) return "Half";
  return "Three-Quarters";
}

export function evaluateShare(ctx: PremiumContext): BadgeDefinition[] {
  let pop = 0;
  let area = 0;
  for (const code of ctx.visitedCountryCodes) {
    pop += POPULATION_BY_CODE[code] ?? 0;
    area += AREA_BY_CODE[code] ?? 0;
  }
  const popShare = pop / WORLD_POPULATION;
  const areaShare = area / EARTH_LAND_AREA_KM2;
  const out: BadgeDefinition[] = [];
  for (const t of SHARE_STAGES) {
    if (popShare >= t) {
      out.push({
        id: `premium_humanity_${Math.round(t * 100)}`,
        category: "premium_share",
        titleKo: `인류의 ${tierKo(t)}`,
        titleEn: `${tierEn(t)} of Humanity`,
        description: `방문국 인구가 세계 인구의 ${Math.round(t * 100)}% 이상`,
        emoji: "👥",
        rank: 80,
      });
    }
    if (areaShare >= t) {
      out.push({
        id: `premium_earth_${Math.round(t * 100)}`,
        category: "premium_share",
        titleKo: `지구의 ${tierKo(t)}`,
        titleEn: `${tierEn(t)} of Earth`,
        description: `방문국 면적이 지구 육지의 ${Math.round(t * 100)}% 이상`,
        emoji: "🌍",
        rank: 80,
      });
    }
  }
  return out;
}
