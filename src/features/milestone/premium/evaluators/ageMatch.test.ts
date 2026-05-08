import { evaluateAgeMatch } from "./ageMatch";
import type { PremiumContext } from "../types";

function ctx(visited: number, age: number): PremiumContext {
  return {
    birth: { year: 1990, month: 1, day: 1 },
    homeCountry: "KR",
    photos: [],
    visitedCountriesCount: visited,
    visitedCountryCodes: Array.from({ length: visited }, (_, i) => `C${i}`),
    currentAge: age,
  };
}

describe("evaluateAgeMatch", () => {
  it("emits stage 1 when visited >= age", () => {
    const ids = evaluateAgeMatch(ctx(35, 35)).map((b) => b.id);
    expect(ids).toContain("premium_age_match_x1");
  });
  it("emits stage 3 when visited >= age × 2", () => {
    const ids = evaluateAgeMatch(ctx(70, 35)).map((b) => b.id);
    expect(ids).toEqual(expect.arrayContaining([
      "premium_age_match_x1",
      "premium_age_match_x1_5",
      "premium_age_match_x2",
    ]));
  });
  it("emits nothing when birth/age unknown", () => {
    const ids = evaluateAgeMatch({
      ...ctx(50, 0),
      birth: null,
      currentAge: null,
    }).map((b) => b.id);
    expect(ids).toEqual([]);
  });
});
