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
  it("composes context from profile + visit data", async () => {
    const ctx = await buildPremiumContext({
      profile: { birthYear: 1995, birthMonth: 6, birthDay: 15, gender: "male" },
      homeCountryCode: "KR",
      visitedCountryCodes: ["KR", "JP", "FR"],
      now: new Date(2025, 8, 1).getTime(),
    });
    expect(ctx.birth).toEqual({ year: 1995, month: 6, day: 15 });
    expect(ctx.homeCountry).toBe("KR");
    expect(ctx.visitedCountryCodes).toEqual(["KR", "JP", "FR"]);
    expect(ctx.visitedCountriesCount).toBe(3);
    expect(ctx.currentAge).toBe(30);
    expect(ctx.photos).toHaveLength(2);
  });
  it("yields null fields when profile missing", async () => {
    const ctx = await buildPremiumContext({
      profile: null,
      homeCountryCode: null,
      visitedCountryCodes: [],
      now: Date.now(),
    });
    expect(ctx.birth).toBeNull();
    expect(ctx.currentAge).toBeNull();
  });
});
