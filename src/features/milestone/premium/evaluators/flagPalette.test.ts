import { evaluateFlagPalette } from "./flagPalette";
import type { PremiumContext } from "../types";

jest.mock("../../../badges/data", () => ({
  FLAG_COLORS_BY_CODE: {
    KR: ["red", "blue", "white", "black"],
    JP: ["red", "white"],
    BR: ["green", "yellow", "blue", "white"],
    DE: ["black", "red", "yellow"],
    IE: ["green", "white", "orange"],
  },
}));

function ctx(codes: string[]): PremiumContext {
  return {
    homeCountry: "KR",
    photos: [], visitedCountriesCount: codes.length,
    visitedCountryCodes: codes,
  };
}

describe("evaluateFlagPalette", () => {
  it("emits 5-color stage with 5 distinct colors", () => {
    const ids = evaluateFlagPalette(ctx(["KR", "BR"])).map((b) => b.id);
    expect(ids).toContain("premium_flag_palette_5");
  });
  it("emits 7-color stage when all 7 collected", () => {
    const ids = evaluateFlagPalette(ctx(["KR","BR","DE","IE"])).map((b) => b.id);
    expect(ids).toContain("premium_flag_palette_7");
  });
  it("emits nothing with fewer than 5 colors", () => {
    expect(evaluateFlagPalette(ctx(["JP"]))).toEqual([]);
  });
});
