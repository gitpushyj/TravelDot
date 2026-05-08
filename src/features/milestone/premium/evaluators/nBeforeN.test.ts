import { evaluateNBeforeN } from "./nBeforeN";
import type { PremiumContext } from "../types";

const birth = { year: 2000, month: 1, day: 1 };

function ctx(photos: { code: string; year: number }[]): PremiumContext {
  return {
    birth,
    homeCountry: "KR",
    photos: photos.map((p) => ({
      countryCode: p.code,
      takenAtMs: new Date(p.year, 5, 1).getTime(),
    })),
    visitedCountriesCount: new Set(photos.map((p) => p.code)).size,
    visitedCountryCodes: Array.from(new Set(photos.map((p) => p.code))),
    currentAge: 30,
  };
}

describe("evaluateNBeforeN", () => {
  it("emits no badge when no photos before age 20", () => {
    expect(evaluateNBeforeN(ctx([]))).toEqual([]);
  });
  it("emits 5 Before 20 when ≥5 unique countries before age 20", () => {
    const c = ctx([
      { code: "KR", year: 2015 },
      { code: "JP", year: 2016 },
      { code: "CN", year: 2017 },
      { code: "US", year: 2018 },
      { code: "FR", year: 2019 },
    ]);
    const out = evaluateNBeforeN(c);
    expect(out.map((b) => b.id)).toContain("premium_n_before_n_5_20");
  });
  it("does not emit when threshold reached after the cutoff age", () => {
    const c = ctx([
      { code: "KR", year: 2025 },
      { code: "JP", year: 2025 },
      { code: "CN", year: 2025 },
      { code: "US", year: 2025 },
      { code: "FR", year: 2025 },
    ]);
    const out = evaluateNBeforeN(c);
    expect(out.map((b) => b.id)).not.toContain("premium_n_before_n_5_20");
  });
  it("emits cumulatively for multiple stages", () => {
    const photos = [];
    for (let i = 0; i < 20; i++) {
      photos.push({ code: `C${i}`, year: 2010 + Math.floor(i / 4) });
    }
    const ids = evaluateNBeforeN(ctx(photos)).map((b) => b.id);
    expect(ids).toContain("premium_n_before_n_5_20");
    expect(ids).toContain("premium_n_before_n_10_25");
    expect(ids).toContain("premium_n_before_n_20_30");
  });
});
