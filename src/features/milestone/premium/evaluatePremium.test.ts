import { evaluatePremiumBadges } from "./evaluatePremium";
import type { PremiumContext } from "./types";

jest.mock("../../badges/data", () => ({
  POPULATION_BY_CODE: {}, AREA_BY_CODE: {}, FLAG_COLORS_BY_CODE: {},
  OFFICIAL_LANGUAGES_BY_CODE: {}, UTC_OFFSET_BY_CODE: {},
  WORLD_POPULATION: 8e9, EARTH_LAND_AREA_KM2: 1.4894e8,
}));

const empty: PremiumContext = {
  birth: null, homeCountry: null, photos: [],
  visitedCountriesCount: 0, visitedCountryCodes: [], currentAge: null,
};

describe("evaluatePremiumBadges", () => {
  it("returns empty array when context yields no matches", () => {
    expect(evaluatePremiumBadges(empty)).toEqual([]);
  });
});
