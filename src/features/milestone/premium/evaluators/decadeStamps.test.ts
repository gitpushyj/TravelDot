import { evaluateDecadeStamps } from "./decadeStamps";
import type { PremiumContext } from "../types";

function makeCtx(photos: { code: string; ageAtPhoto: number }[]): PremiumContext {
  const birthYear = 1990;
  return {
    birth: { year: birthYear, month: 6, day: 15 },
    homeCountry: "KR",
    photos: photos.map((p) => ({
      countryCode: p.code,
      takenAtMs: new Date(birthYear + p.ageAtPhoto, 6, 1).getTime(),
    })),
    visitedCountriesCount: new Set(photos.map((p) => p.code)).size,
    visitedCountryCodes: [...new Set(photos.map((p) => p.code))],
    currentAge: 35,
  };
}

describe("evaluateDecadeStamps", () => {
  it("emits 10s badge with 5 unique countries in teens", () => {
    const photos = [10, 12, 14, 16, 18].map((age, i) => ({
      code: `C${i}`,
      ageAtPhoto: age,
    }));
    const ids = evaluateDecadeStamps(makeCtx(photos)).map((b) => b.id);
    expect(ids).toContain("premium_decade_10s");
  });
  it("does not emit 20s badge with only 14 countries in 20s", () => {
    const photos = Array.from({ length: 14 }, (_, i) => ({
      code: `C${i}`,
      ageAtPhoto: 22,
    }));
    const ids = evaluateDecadeStamps(makeCtx(photos)).map((b) => b.id);
    expect(ids).not.toContain("premium_decade_20s");
  });
  it("emits 50s+ for ages 50 and older combined", () => {
    const photos = Array.from({ length: 15 }, (_, i) => ({
      code: `C${i}`,
      ageAtPhoto: 50 + (i % 20),
    }));
    const ids = evaluateDecadeStamps(makeCtx(photos)).map((b) => b.id);
    expect(ids).toContain("premium_decade_50plus");
  });
});
