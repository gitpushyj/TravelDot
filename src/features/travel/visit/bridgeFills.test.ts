import { computeBridgeFills, type DayKey } from "./bridgeFills";

const d = (countryCode: string, date: string): DayKey => ({
  countryCode,
  date,
});

describe("computeBridgeFills", () => {
  it("returns empty for single day", () => {
    expect(computeBridgeFills([d("CN", "2024-03-01")], 3)).toEqual([]);
  });

  it("fills 1-day gap when threshold=3 (gap=2)", () => {
    expect(
      computeBridgeFills([d("CN", "2024-03-01"), d("CN", "2024-03-03")], 3)
    ).toEqual([d("CN", "2024-03-02")]);
  });

  it("fills 2-day gap when threshold=3 (gap=3)", () => {
    expect(
      computeBridgeFills([d("CN", "2024-03-01"), d("CN", "2024-03-04")], 3)
    ).toEqual([d("CN", "2024-03-02"), d("CN", "2024-03-03")]);
  });

  it("does NOT fill 3-day gap when threshold=3 (gap=4)", () => {
    expect(
      computeBridgeFills([d("CN", "2024-03-01"), d("CN", "2024-03-05")], 3)
    ).toEqual([]);
  });

  it("does not bridge across countries", () => {
    expect(
      computeBridgeFills([d("CN", "2024-03-01"), d("JP", "2024-03-02")], 3)
    ).toEqual([]);
  });

  it("handles unsorted input by sorting first", () => {
    expect(
      computeBridgeFills(
        [
          d("JP", "2024-04-03"),
          d("JP", "2024-04-01"),
          d("CN", "2024-03-03"),
          d("CN", "2024-03-01"),
        ],
        3
      )
    ).toEqual([d("CN", "2024-03-02"), d("JP", "2024-04-02")]);
  });

  it("handles consecutive days (no fill needed)", () => {
    expect(
      computeBridgeFills(
        [
          d("CN", "2024-03-01"),
          d("CN", "2024-03-02"),
          d("CN", "2024-03-03"),
        ],
        3
      )
    ).toEqual([]);
  });
});
