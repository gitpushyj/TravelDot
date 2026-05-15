import { FLAG_COLORS_BY_CODE } from "../badges/data";
import { shuffle } from "./shuffle";

// 헷갈리는 오답 후보로 우선 고려할 "색상 유사 상위" 개수.
const CONFUSING_TOP_K = 8;
const DISTRACTOR_COUNT = 3;

// 두 국가 국기 색상 집합의 Jaccard 유사도 (교집합 / 합집합). 0~1.
export function colorSimilarity(a: string, b: string): number {
  const ca = FLAG_COLORS_BY_CODE[a] ?? [];
  const cb = FLAG_COLORS_BY_CODE[b] ?? [];
  if (ca.length === 0 && cb.length === 0) return 0;
  const setA = new Set(ca);
  const setB = new Set(cb);
  let inter = 0;
  for (const c of setA) if (setB.has(c)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

// 정답을 제외한, 색상이 헷갈리는 오답 3개를 고른다.
// tierPool: 같은 티어 코드들(정답 포함 가능). fallbackPool: 인접 티어 보충용.
export function pickDistractors(
  answer: string,
  tierPool: readonly string[],
  fallbackPool: readonly string[],
  rng: () => number = Math.random,
): string[] {
  let candidates = tierPool.filter((c) => c !== answer);
  if (candidates.length < DISTRACTOR_COUNT) {
    const extra = fallbackPool.filter((c) => c !== answer && !candidates.includes(c));
    candidates = candidates.concat(extra);
  }
  // 색상 유사도 내림차순 정렬 후 상위 K개를 "헷갈리는 후보"로.
  const ranked = candidates
    .slice()
    .sort((a, b) => colorSimilarity(answer, b) - colorSimilarity(answer, a));
  const confusing = ranked.slice(0, Math.max(CONFUSING_TOP_K, DISTRACTOR_COUNT));
  return shuffle(confusing, rng).slice(0, DISTRACTOR_COUNT);
}
