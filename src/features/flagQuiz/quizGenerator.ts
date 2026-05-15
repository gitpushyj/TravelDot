import { pickDistractors } from "./distractors";
import { shuffle } from "./shuffle";
import { TIER_COUNTRIES, tierForQuestionIndex, type Tier } from "./tiers";

export type QuizQuestion = {
  // 정답 국가 ISO alpha-2 코드.
  answerCode: string;
  // 4지선다 코드 (정답 포함, 셔플됨).
  choices: string[];
};

// 인접 티어 풀: 보충용. 현재 티어보다 한 단계 위/아래를 합친다.
function adjacentPool(tier: Tier): string[] {
  const lower = tier > 1 ? TIER_COUNTRIES[(tier - 1) as Tier] : [];
  const upper = tier < 4 ? TIER_COUNTRIES[(tier + 1) as Tier] : [];
  return [...lower, ...upper];
}

// answeredCount(0-based): 지금까지 푼 문제 수. usedCodes: 이번 게임에서 이미 정답으로 낸 코드.
export function generateQuestion(
  answeredCount: number,
  usedCodes: Set<string>,
  rng: () => number = Math.random,
): QuizQuestion {
  const tier = tierForQuestionIndex(answeredCount);
  const tierPool = TIER_COUNTRIES[tier];
  let available = tierPool.filter((c) => !usedCodes.has(c));
  // 티어가 소진되면(드문 케이스) 중복을 허용한다.
  if (available.length === 0) available = tierPool;

  const answerCode = shuffle(available, rng)[0];
  const distractors = pickDistractors(answerCode, tierPool, adjacentPool(tier), rng);
  const choices = shuffle([answerCode, ...distractors], rng);
  return { answerCode, choices };
}
