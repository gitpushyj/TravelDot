import { evaluateShare } from "./share";

jest.mock("../../../badges/data", () => ({
  POPULATION_BY_CODE: { KR: 51_000_000, CN: 2_400_000_000, IN: 1_400_000_000 },
  AREA_BY_CODE: { KR: 100_363, CN: 9_596_961, IN: 3_287_263 },
  WORLD_POPULATION: 8_000_000_000,
  EARTH_LAND_AREA_KM2: 148_940_000,
}));

import type { PremiumContext } from "../types";
function ctx(codes: string[]): PremiumContext {
  return {
    birth: null,
    homeCountry: null,
    photos: [],
    visitedCountriesCount: codes.length,
    visitedCountryCodes: codes,
    currentAge: null,
  };
}

describe("evaluateShare", () => {
  it("emits Quarter of Humanity at ≥25% population", () => {
    const ids = evaluateShare(ctx(["CN"])).map((b) => b.id);
    expect(ids).toContain("premium_humanity_25");
  });
  it("emits Quarter of Earth at ≥25% area", () => {
    const ids = evaluateShare(ctx(["CN", "IN"])).map((b) => b.id);
    expect(ids).not.toContain("premium_earth_25");
  });
  it("emits no badge with empty visit list", () => {
    expect(evaluateShare(ctx([]))).toEqual([]);
  });
});
