import { getAirportByIata, searchAirports } from "../airports";

describe("airports", () => {
  it("getAirportByIata returns ICN", () => {
    const a = getAirportByIata("ICN");
    expect(a).toBeDefined();
    expect(a?.city).toBe("Seoul");
    expect(a?.country).toBe("KR");
  });

  it("getAirportByIata is case insensitive", () => {
    const a = getAirportByIata("icn");
    expect(a?.iata).toBe("ICN");
  });

  it("getAirportByIata returns undefined for unknown", () => {
    expect(getAirportByIata("ZZZ")).toBeUndefined();
  });

  it("search by IATA promotes exact match to first result", () => {
    const r = searchAirports("ICN");
    expect(r[0]?.iata).toBe("ICN");
  });

  it("search by city name matches in English", () => {
    const r = searchAirports("Seoul");
    const iatas = r.map((a) => a.iata);
    expect(iatas).toContain("ICN");
    expect(iatas).toContain("GMP");
  });

  it("search by Korean city alias", () => {
    const r = searchAirports("도쿄");
    const iatas = r.map((a) => a.iata);
    expect(iatas).toContain("NRT");
    expect(iatas).toContain("HND");
  });

  it("search empty query returns nothing", () => {
    expect(searchAirports("")).toEqual([]);
    expect(searchAirports("   ")).toEqual([]);
  });

  it("search respects limit", () => {
    const r = searchAirports("a", 5);
    expect(r.length).toBeLessThanOrEqual(5);
  });
});
