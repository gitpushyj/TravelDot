import { evaluateCalendar } from "./calendar";
import type { PremiumContext } from "../types";

function ctx(months: number[]): PremiumContext {
  return {
    birth: null,
    homeCountry: "KR",
    photos: months.map((m) => ({
      countryCode: "JP",
      takenAtMs: new Date(2020, m - 1, 15).getTime(),
    })),
    visitedCountriesCount: 0,
    visitedCountryCodes: [],
    currentAge: null,
  };
}

describe("evaluateCalendar", () => {
  it("emits half-year at 6 unique foreign months", () => {
    const ids = evaluateCalendar(ctx([1, 3, 5, 7, 9, 11])).map((b) => b.id);
    expect(ids).toEqual(["premium_calendar_6"]);
  });
  it("emits both stages at 12 months", () => {
    const ids = evaluateCalendar(
      ctx([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    ).map((b) => b.id);
    expect(ids).toEqual(
      expect.arrayContaining(["premium_calendar_6", "premium_calendar_12"])
    );
  });
  it("ignores home country photos", () => {
    const c = ctx([1, 2, 3, 4, 5, 6]);
    c.photos.forEach((p) => (p.countryCode = "KR"));
    expect(evaluateCalendar(c)).toEqual([]);
  });
});
