import { formatTripDateRange } from "./tripFormat";

describe("formatTripDateRange", () => {
  it("single-day trip shows just the start date", () => {
    expect(formatTripDateRange("2017-02-18", "2017-02-18")).toBe("2017.02.18");
  });

  it("multi-day trip in same year omits year on end", () => {
    expect(formatTripDateRange("2024-03-20", "2024-03-22")).toBe(
      "2024.03.20 – 03.22"
    );
  });

  it("multi-day trip across years shows year on both ends", () => {
    expect(formatTripDateRange("2023-12-30", "2024-01-02")).toBe(
      "2023.12.30 – 2024.01.02"
    );
  });
});
