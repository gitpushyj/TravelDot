import { generateQuestion } from "./quizGenerator";
import { TIER_COUNTRIES } from "./tiers";

function seqRng(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("generateQuestion", () => {
  it("정답을 포함한 서로 다른 4개 선택지를 만든다", () => {
    const q = generateQuestion(0, new Set(), seqRng([0.1, 0.2, 0.3, 0.4, 0.5]));
    expect(q.choices).toHaveLength(4);
    expect(q.choices).toContain(q.answerCode);
    expect(new Set(q.choices).size).toBe(4);
  });

  it("answeredCount 0이면 티어 1 국가가 정답이다", () => {
    const q = generateQuestion(0, new Set(), seqRng([0, 0, 0, 0, 0]));
    expect(TIER_COUNTRIES[1]).toContain(q.answerCode);
  });

  it("이미 사용한 코드는 정답으로 다시 내지 않는다", () => {
    const used = new Set(TIER_COUNTRIES[1].slice(0, TIER_COUNTRIES[1].length - 1));
    // 티어 1에서 1개만 남김 → 그 1개가 정답이어야 함
    const remaining = TIER_COUNTRIES[1][TIER_COUNTRIES[1].length - 1];
    const q = generateQuestion(0, used, seqRng([0, 0, 0, 0]));
    expect(q.answerCode).toBe(remaining);
  });
});
