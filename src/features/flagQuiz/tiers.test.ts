import { TIER_COUNTRIES, ALL_TIERS, tierForQuestionIndex } from "./tiers";

describe("TIER_COUNTRIES", () => {
  it("4개 티어로 UN 193개국을 빠짐없이 나눈다", () => {
    const total = ALL_TIERS.reduce((n, t) => n + TIER_COUNTRIES[t].length, 0);
    expect(total).toBe(193);
  });

  it("티어 간 중복이 없다", () => {
    const all = ALL_TIERS.flatMap((t) => TIER_COUNTRIES[t]);
    expect(new Set(all).size).toBe(193);
  });

  it("잘 알려진 나라는 티어 1, 인기 순위 미등재국은 티어 4", () => {
    expect(TIER_COUNTRIES[1]).toContain("FR"); // popularityRank 1
    expect(TIER_COUNTRIES[1]).toContain("US");
    // 투발루(TV)는 popularityRank 미등재 → 티어 4
    expect(TIER_COUNTRIES[4]).toContain("TV");
  });
});

describe("tierForQuestionIndex", () => {
  it("푼 문제 수에 따라 밴드별 티어를 반환한다", () => {
    // 1~6 → T1, 7~15 → T2, 16~27 → T3, 28~ → T4 (answeredCount는 0-based)
    expect(tierForQuestionIndex(0)).toBe(1); // 1번째 문제
    expect(tierForQuestionIndex(5)).toBe(1); // 6번째
    expect(tierForQuestionIndex(6)).toBe(2); // 7번째
    expect(tierForQuestionIndex(14)).toBe(2); // 15번째
    expect(tierForQuestionIndex(15)).toBe(3); // 16번째
    expect(tierForQuestionIndex(26)).toBe(3); // 27번째
    expect(tierForQuestionIndex(27)).toBe(4); // 28번째
    expect(tierForQuestionIndex(200)).toBe(4);
  });
});
