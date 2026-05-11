import {
  formatDurationMinutes,
  formatHm,
  hmToEpochAfter,
  hmToEpochToday,
  parseHm,
} from "../timeUtils";

describe("parseHm", () => {
  it("parses HH:MM", () => {
    expect(parseHm("14:32")).toEqual({ h: 14, m: 32 });
    expect(parseHm("9:05")).toEqual({ h: 9, m: 5 });
    expect(parseHm("00:00")).toEqual({ h: 0, m: 0 });
    expect(parseHm("23:59")).toEqual({ h: 23, m: 59 });
  });

  it("parses 4-digit form", () => {
    expect(parseHm("1432")).toEqual({ h: 14, m: 32 });
    expect(parseHm("0905")).toEqual({ h: 9, m: 5 });
  });

  it("rejects out-of-range", () => {
    expect(parseHm("24:00")).toBeNull();
    expect(parseHm("12:60")).toBeNull();
    expect(parseHm("-1:30")).toBeNull();
  });

  it("rejects garbage", () => {
    expect(parseHm("abc")).toBeNull();
    expect(parseHm("")).toBeNull();
    expect(parseHm("123:45")).toBeNull();
  });
});

describe("formatHm", () => {
  it("formats epoch into HH:MM in local tz", () => {
    const now = new Date();
    now.setHours(7, 5, 0, 0);
    expect(formatHm(now.getTime())).toBe("07:05");
    now.setHours(23, 59, 0, 0);
    expect(formatHm(now.getTime())).toBe("23:59");
  });
});

describe("hmToEpochAfter", () => {
  it("returns same-day epoch when target is later", () => {
    const base = new Date();
    base.setHours(10, 0, 0, 0);
    const result = hmToEpochAfter(14, 30, base.getTime());
    const out = new Date(result);
    expect(out.getHours()).toBe(14);
    expect(out.getMinutes()).toBe(30);
    expect(out.getTime()).toBeGreaterThan(base.getTime());
  });

  it("rolls to next day when target is earlier", () => {
    const base = new Date();
    base.setHours(22, 0, 0, 0);
    const result = hmToEpochAfter(2, 30, base.getTime());
    const diff = result - base.getTime();
    // 22:00 → 다음날 02:30 = 4시간 30분 차이.
    expect(diff).toBeGreaterThan(4 * 60 * 60 * 1000);
    expect(diff).toBeLessThan(5 * 60 * 60 * 1000);
  });

  it("rolls to next day when target equals after", () => {
    const base = new Date();
    base.setHours(10, 0, 0, 0);
    const result = hmToEpochAfter(10, 0, base.getTime());
    expect(result - base.getTime()).toBe(24 * 60 * 60 * 1000);
  });
});

describe("hmToEpochToday", () => {
  it("returns today HH:MM in local tz", () => {
    const now = Date.now();
    const r = hmToEpochToday(14, 30, now);
    const d = new Date(r);
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
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
