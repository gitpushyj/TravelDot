import { evaluateFourSeasons } from "./fourSeasons";
import type { PremiumContext } from "../types";

function photo(code: string, year: number, month: number) {
  return { countryCode: code, takenAtMs: new Date(year, month - 1, 15).getTime() };
}
function ctx(photos: { countryCode: string; takenAtMs: number }[]): PremiumContext {
  return {
    birth: { year: 1990, month: 1, day: 1 },
    homeCountry: "KR",
    photos,
    visitedCountriesCount: 0,
    visitedCountryCodes: [],
    currentAge: 35,
  };
}

describe("evaluateFourSeasons", () => {
  it("emits when all 4 seasons covered for one country", () => {
    const c = ctx([
      photo("JP", 2020, 4),
      photo("JP", 2020, 7),
      photo("JP", 2020, 10),
      photo("JP", 2020, 1),
    ]);
    const ids = evaluateFourSeasons(c).map((b) => b.id);
    expect(ids).toEqual(["premium_four_seasons_JP"]);
  });
  it("ignores home country", () => {
    const c = ctx([
      photo("KR", 2020, 4), photo("KR", 2020, 7),
      photo("KR", 2020, 10), photo("KR", 2020, 1),
    ]);
    expect(evaluateFourSeasons(c)).toEqual([]);
  });
  it("does not emit with only 3 seasons", () => {
    const c = ctx([
      photo("JP", 2020, 4), photo("JP", 2020, 7), photo("JP", 2020, 10),
    ]);
    expect(evaluateFourSeasons(c)).toEqual([]);
  });
});
