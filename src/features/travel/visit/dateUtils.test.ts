import { addOneDay, diffInDays } from "./dateUtils";

describe("diffInDays", () => {
  it("returns 0 for same day", () => {
    expect(diffInDays("2024-03-05", "2024-03-05")).toBe(0);
  });
  it("returns 1 for next day", () => {
    expect(diffInDays("2024-03-05", "2024-03-06")).toBe(1);
  });
  it("handles month boundary on leap year", () => {
    expect(diffInDays("2024-02-28", "2024-03-01")).toBe(2);
  });
  it("handles year boundary", () => {
    expect(diffInDays("2023-12-31", "2024-01-01")).toBe(1);
  });
});

describe("addOneDay", () => {
  it("adds one day", () => {
    expect(addOneDay("2024-03-05")).toBe("2024-03-06");
  });
  it("rolls month", () => {
    expect(addOneDay("2024-03-31")).toBe("2024-04-01");
  });
  it("rolls leap-year february", () => {
    expect(addOneDay("2024-02-29")).toBe("2024-03-01");
  });
});
