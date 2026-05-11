import { estimateFlightMinutes } from "../estimateFlightDuration";

describe("estimateFlightMinutes", () => {
  // ICN(37.47, 126.45) → NRT(35.77, 140.39): 약 1240km / 800kmh ≈ 1.55h + 30min ≈ 122min.
  it("ICN→NRT around 2 hours", () => {
    const m = estimateFlightMinutes(37.4691, 126.4505, 35.772, 140.3929);
    expect(m).toBeGreaterThan(110);
    expect(m).toBeLessThan(140);
  });

  // 단거리: GMP(서울) → CJU(제주) 약 450km → 약 34min + 30min = 64min.
  it("GMP→CJU under 90 minutes", () => {
    const m = estimateFlightMinutes(37.5583, 126.7906, 33.5113, 126.493);
    expect(m).toBeGreaterThan(50);
    expect(m).toBeLessThan(90);
  });

  // 장거리: ICN → JFK 약 11000km → 약 13.75h + 0.5h = 14.25h ≈ 855min.
  it("ICN→JFK around 14 hours", () => {
    const m = estimateFlightMinutes(37.4691, 126.4505, 40.6413, -73.7781);
    expect(m).toBeGreaterThan(800);
    expect(m).toBeLessThan(900);
  });
});
