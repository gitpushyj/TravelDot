import countriesJson from "../../../assets/data/countries.json";
import { popularityRank } from "../../utils/countryPopularity";
import { isUnMember } from "../../utils/unMembers";

export type Tier = 1 | 2 | 3 | 4;
export const ALL_TIERS: Tier[] = [1, 2, 3, 4];

type CountryEntry = { code: string; name: string; nameKo: string };

// 티어 경계 (popularityRank 기준). 튜닝 지점.
//   T1: rank 1~25, T2: 26~60, T3: 61~106, T4: 107(미등재)
const TIER_RANK_MAX: Record<Tier, number> = { 1: 25, 2: 60, 3: 106, 4: Infinity };

function classifyTier(code: string): Tier {
  const rank = popularityRank(code);
  if (rank <= TIER_RANK_MAX[1]) return 1;
  if (rank <= TIER_RANK_MAX[2]) return 2;
  if (rank <= TIER_RANK_MAX[3]) return 3;
  return 4;
}

// 모듈 로드 시 1회 계산: UN 193개국을 4티어로 분류한다.
export const TIER_COUNTRIES: Record<Tier, string[]> = (() => {
  const buckets: Record<Tier, string[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const entry of countriesJson as CountryEntry[]) {
    if (!isUnMember(entry.code)) continue;
    buckets[classifyTier(entry.code)].push(entry.code);
  }
  return buckets;
})();

// 게임 내 진행: 푼 문제 수(0-based answeredCount) → 현재 티어.
//   문제 1~6 → T1, 7~15 → T2, 16~27 → T3, 28~ → T4
const TIER_BAND_END: { end: number; tier: Tier }[] = [
  { end: 6, tier: 1 },
  { end: 15, tier: 2 },
  { end: 27, tier: 3 },
];

export function tierForQuestionIndex(answeredCount: number): Tier {
  const questionNumber = answeredCount + 1; // 1-based
  for (const band of TIER_BAND_END) {
    if (questionNumber <= band.end) return band.tier;
  }
  return 4;
}
