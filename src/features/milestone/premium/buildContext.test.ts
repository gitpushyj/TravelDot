import { buildPremiumContext } from "./buildContext";

jest.mock("../../travel/trip/tripDb", () => ({
  getTripDb: jest.fn().mockResolvedValue({
    getAllAsync: jest.fn().mockResolvedValue([
      { country_code: "JP", taken_at: new Date(2020, 5, 1).getTime() },
      { country_code: "FR", taken_at: new Date(2021, 8, 1).getTime() },
    ]),
  }),
}));

describe("buildPremiumContext", () => {
  it("composes context from visit data", async () => {
    const ctx = await buildPremiumContext({
      homeCountryCode: "KR",
      visitedCountryCodes: ["KR", "JP", "FR"],
    });
    expect(ctx.homeCountry).toBe("KR");
    expect(ctx.visitedCountryCodes).toEqual(["KR", "JP", "FR"]);
    expect(ctx.visitedCountriesCount).toBe(3);
    expect(ctx.photos).toHaveLength(2);
  });
  it("yields null fields when home country missing", async () => {
    const ctx = await buildPremiumContext({
      homeCountryCode: null,
      visitedCountryCodes: [],
    });
    expect(ctx.homeCountry).toBeNull();
    expect(ctx.visitedCountriesCount).toBe(0);
  });
});
