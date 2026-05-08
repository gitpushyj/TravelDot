import {
  POPULATION_BY_CODE,
  AREA_BY_CODE,
  FLAG_COLORS_BY_CODE,
  OFFICIAL_LANGUAGES_BY_CODE,
  UTC_OFFSET_BY_CODE,
} from "./index";
import { WORLD_POPULATION, EARTH_LAND_AREA_KM2 } from "./constants";

describe("static premium data", () => {
  it("includes all major countries", () => {
    // 인구·면적·국기·UTC 스모크: 큰 국가들이 누락되면 안 됨.
    for (const code of ["KR", "JP", "US", "FR", "BR", "ZA"]) {
      expect(POPULATION_BY_CODE[code]).toBeGreaterThan(0);
      expect(AREA_BY_CODE[code]).toBeGreaterThan(0);
      expect(FLAG_COLORS_BY_CODE[code].length).toBeGreaterThan(0);
      expect(typeof UTC_OFFSET_BY_CODE[code]).toBe("number");
    }
    // 공용어는 UN 6개 언어(en/zh/es/fr/ru/ar)만 기록 → UN6를 공용어로 둔
    // 대표 국가들에서만 비어있지 않다는 것을 확인.
    for (const code of ["US", "FR", "ZA", "CN", "RU", "SA"]) {
      expect(OFFICIAL_LANGUAGES_BY_CODE[code].length).toBeGreaterThan(0);
    }
  });
  it("flag colors are within 7-color palette", () => {
    const palette = new Set([
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "black",
      "white",
    ]);
    for (const colors of Object.values(FLAG_COLORS_BY_CODE)) {
      for (const c of colors) expect(palette.has(c)).toBe(true);
    }
  });
  it("global totals match expected order of magnitude", () => {
    expect(WORLD_POPULATION).toBeGreaterThan(7_000_000_000);
    expect(EARTH_LAND_AREA_KM2).toBe(148_940_000);
  });
});
