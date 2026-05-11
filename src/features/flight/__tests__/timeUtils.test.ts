import { formatDurationMinutes, formatHm } from "../timeUtils";

describe("formatHm", () => {
  it("formats epoch into HH:MM in local tz", () => {
    const now = new Date();
    now.setHours(7, 5, 0, 0);
    expect(formatHm(now.getTime())).toBe("07:05");
    now.setHours(23, 59, 0, 0);
    expect(formatHm(now.getTime())).toBe("23:59");
  });
});

describe("formatDurationMinutes", () => {
  it("under 1 hour", () => {
    expect(formatDurationMinutes(45)).toBe("45m");
    expect(formatDurationMinutes(0)).toBe("0m");
  });

  it("exact hours", () => {
    expect(formatDurationMinutes(60)).toBe("1h");
    expect(formatDurationMinutes(180)).toBe("3h");
  });

  it("hours and minutes", () => {
    expect(formatDurationMinutes(75)).toBe("1h 15m");
    expect(formatDurationMinutes(252)).toBe("4h 12m");
  });
});
