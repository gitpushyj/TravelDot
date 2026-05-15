jest.mock("../badges/data", () => ({
  FLAG_COLORS_BY_CODE: {
    AA: ["red", "white"],
    BB: ["red", "white"], // AA와 동일 → 유사도 1
    CC: ["red", "white", "blue"], // AA와 높은 유사도
    DD: ["green", "yellow"], // AA와 유사도 0
    EE: ["green", "yellow", "black"], // AA와 유사도 0
    FF: ["green", "black"], // AA와 유사도 0
    D1: ["green", "black"],
    D2: ["green", "black"],
    D3: ["green", "black"],
    D4: ["green", "black"],
    D5: ["green", "black"],
    D6: ["green", "black"],
    D7: ["green", "black"],
    D8: ["green", "black"],
  },
}));

import { colorSimilarity, pickDistractors } from "./distractors";

function seqRng(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("colorSimilarity", () => {
  it("동일 색 집합은 1", () => {
    expect(colorSimilarity("AA", "BB")).toBe(1);
  });
  it("공통 색이 없으면 0", () => {
    expect(colorSimilarity("AA", "DD")).toBe(0);
  });
  it("부분 겹침은 0과 1 사이 (교집합/합집합)", () => {
    // AA{red,white} vs CC{red,white,blue} → 2/3
    expect(colorSimilarity("AA", "CC")).toBeCloseTo(2 / 3);
  });
});

describe("pickDistractors", () => {
  it("정답을 제외한 서로 다른 3개를 반환한다", () => {
    const out = pickDistractors(
      "AA",
      ["AA", "BB", "CC", "DD", "EE", "FF"],
      [],
      seqRng([0.3, 0.6, 0.1]),
    );
    expect(out).toHaveLength(3);
    expect(out).not.toContain("AA");
    expect(new Set(out).size).toBe(3);
  });

  it("같은 티어 후보가 3개 미만이면 fallback 풀에서 보충한다", () => {
    const out = pickDistractors(
      "AA",
      ["AA", "BB"],
      ["DD", "EE", "FF"],
      seqRng([0.3, 0.6, 0.1]),
    );
    expect(out).toHaveLength(3);
    expect(out).not.toContain("AA");
    expect(new Set(out).size).toBe(3);
    // tierPool에서 쓸 수 있는 후보는 BB 하나뿐 → 최소 2개는 fallback에서 와야 한다.
    const fromFallback = out.filter((c) => ["DD", "EE", "FF"].includes(c));
    expect(fromFallback.length).toBeGreaterThanOrEqual(2);
  });

  it("후보가 CONFUSING_TOP_K보다 많으면 유사도 최하위 후보는 제외된다", () => {
    // AA와 유사: BB(1.0), CC(0.67). 나머지 D1~D8은 유사도 0.
    // 유사도 내림차순 ranked = [BB, CC, D1..D8] (동점은 안정 정렬로 입력 순서 유지).
    // confusing = 상위 8 = [BB, CC, D1..D6] → D7, D8은 절대 선택되지 않는다.
    const tierPool = ["AA", "BB", "CC", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"];
    const allowed = ["BB", "CC", "D1", "D2", "D3", "D4", "D5", "D6"];
    const out = pickDistractors("AA", tierPool, [], seqRng([0.3, 0.6, 0.1]));
    expect(out).toHaveLength(3);
    expect(out).not.toContain("D7");
    expect(out).not.toContain("D8");
    expect(out.every((c) => allowed.includes(c))).toBe(true);
  });
});
