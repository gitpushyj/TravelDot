import type { RecentTrip } from "../../features/travel/visitRepository";
import {
  containsNonAdjacentGap,
  gapBetween,
  maxGapDays,
} from "./utils";

const t = (startDate: string, endDate: string, days = 1): RecentTrip => ({
  countryCode: "CN",
  startDate,
  endDate,
  days,
});

describe("gapBetween", () => {
  it("returns 1 for back-to-back", () => {
    expect(gapBetween("2024-03-05", "2024-03-06")).toBe(1);
  });
  it("returns gap days", () => {
    expect(gapBetween("2024-03-05", "2024-03-09")).toBe(4);
  });
});

describe("containsNonAdjacentGap (threshold=3)", () => {
  it("false for two adjacent trips (gap=2)", () => {
    expect(
      containsNonAdjacentGap(
        [t("2024-03-01", "2024-03-03"), t("2024-03-05", "2024-03-07")],
        3
      )
    ).toBe(false);
  });
  it("false at gap=3 boundary", () => {
    expect(
      containsNonAdjacentGap(
        [t("2024-03-01", "2024-03-03"), t("2024-03-06", "2024-03-08")],
        3
      )
    ).toBe(false);
  });
  it("true at gap=4", () => {
    expect(
      containsNonAdjacentGap(
        [t("2024-03-01", "2024-03-03"), t("2024-03-07", "2024-03-09")],
        3
      )
    ).toBe(true);
  });
  it("reorders by startDate before checking", () => {
    expect(
      containsNonAdjacentGap(
        [t("2024-03-10", "2024-03-12"), t("2024-03-01", "2024-03-03")],
        3
      )
    ).toBe(true);
  });
  it("false for fewer than 2 trips", () => {
    expect(containsNonAdjacentGap([t("2024-03-01", "2024-03-03")], 3)).toBe(
      false
    );
  });
});

describe("maxGapDays", () => {
  it("returns largest gap", () => {
    expect(
      maxGapDays([
        t("2024-03-01", "2024-03-03"),
        t("2024-03-10", "2024-03-12"), // gap=7
        t("2024-03-15", "2024-03-16"), // gap=3
      ])
    ).toBe(7);
  });
  it("returns 0 for fewer than 2 trips", () => {
    expect(maxGapDays([t("2024-03-01", "2024-03-03")])).toBe(0);
  });
});
