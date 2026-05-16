import { addDays, applyEndChange, applyStartChange } from "./dateRange";

describe("addDays", () => {
  test("forward across month boundary", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });
  test("backward across year boundary", () => {
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
  test("leap year Feb 28 → 29", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });
  test("zero is identity", () => {
    expect(addDays("2026-05-13", 0)).toBe("2026-05-13");
  });
});

describe("applyStartChange", () => {
  test("start before end leaves end alone", () => {
    expect(applyStartChange("2026-05-10", "2026-05-13", "2026-05-14")).toEqual({
      start: "2026-05-10",
      end: "2026-05-14",
    });
  });

  test("start equals end keeps single-day range", () => {
    expect(applyStartChange("2026-05-14", "2026-05-13", "2026-05-14")).toEqual({
      start: "2026-05-14",
      end: "2026-05-14",
    });
  });

  test("start past end shifts end preserving 2-day span", () => {
    expect(applyStartChange("2026-12-13", "2026-05-13", "2026-05-14")).toEqual({
      start: "2026-12-13",
      end: "2026-12-14",
    });
  });

  test("start past end of 1-day trip stays 1-day", () => {
    expect(applyStartChange("2026-12-13", "2026-05-13", "2026-05-13")).toEqual({
      start: "2026-12-13",
      end: "2026-12-13",
    });
  });

  test("start past end of 5-day trip preserves 5 days", () => {
    expect(applyStartChange("2026-08-01", "2026-05-13", "2026-05-17")).toEqual({
      start: "2026-08-01",
      end: "2026-08-05",
    });
  });
});

describe("applyEndChange", () => {
  test("end after start leaves start alone", () => {
    expect(applyEndChange("2026-05-20", "2026-05-13", "2026-05-14")).toEqual({
      start: "2026-05-13",
      end: "2026-05-20",
    });
  });

  test("end equals start keeps single-day range", () => {
    expect(applyEndChange("2026-05-13", "2026-05-13", "2026-05-14")).toEqual({
      start: "2026-05-13",
      end: "2026-05-13",
    });
  });

  test("end before start shifts start preserving 2-day span", () => {
    expect(applyEndChange("2026-01-14", "2026-05-13", "2026-05-14")).toEqual({
      start: "2026-01-13",
      end: "2026-01-14",
    });
  });

  test("end before start of 5-day trip preserves 5 days", () => {
    expect(applyEndChange("2026-01-05", "2026-05-13", "2026-05-17")).toEqual({
      start: "2026-01-01",
      end: "2026-01-05",
    });
  });
});
