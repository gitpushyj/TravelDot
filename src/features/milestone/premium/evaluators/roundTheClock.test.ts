import { evaluateRoundTheClock } from "./roundTheClock";

jest.mock("../../../badges/data", () => ({
  UTC_OFFSET_BY_CODE: { WS: -11, KI: 14, US: -5, JP: 9 },
}));

import type { PremiumContext } from "../types";
function ctx(codes: string[]): PremiumContext {
  return {
    homeCountry: null, photos: [],
    visitedCountriesCount: codes.length,
    visitedCountryCodes: codes,
  };
}

describe("evaluateRoundTheClock", () => {
  it("emits when offset diff >= 24h", () => {
    const ids = evaluateRoundTheClock(ctx(["WS", "KI"])).map((b) => b.id);
    expect(ids).toEqual(["premium_round_the_clock"]);
  });
  it("does not emit at 14h diff", () => {
    expect(evaluateRoundTheClock(ctx(["US", "JP"]))).toEqual([]);
  });
});
