import { diffInDays } from "../visit/dateUtils";
import { listTrips } from "./tripRepository";
import { tripDayCount, expandTripDays } from "./tripDays";
import type { Trip } from "./tripTypes";

// YearSummary는 외부 화면에서 그대로 쓰던 형태.
export type YearSummary = {
  year: number;
  days: number;
  countries: number;
  monthly: number[]; // length 12
};

// 국가별 총 일수. 트립 일수를 country별로 합산.
export async function loadVisitCounts(): Promise<Record<string, number>> {
  const trips = await listTrips();
  const out: Record<string, number> = {};
  for (const t of trips) {
    out[t.countryCode] = (out[t.countryCode] ?? 0) + tripDayCount(t);
  }
  return out;
}

// 특정 연도의 국가별 일수. 연도 경계를 가로지르는 트립은 겹치는 부분만 카운트.
export async function loadVisitCountsByYear(
  year: number
): Promise<Record<string, number>> {
  const trips = await listTrips();
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const out: Record<string, number> = {};
  for (const t of trips) {
    const days = overlapDays(t, yearStart, yearEnd);
    if (days > 0) {
      out[t.countryCode] = (out[t.countryCode] ?? 0) + days;
    }
  }
  return out;
}

export async function loadTotalVisitDays(): Promise<number> {
  const trips = await listTrips();
  return trips.reduce((sum, t) => sum + tripDayCount(t), 0);
}

export async function loadLatestVisitDate(): Promise<string | null> {
  const trips = await listTrips();
  let latest: string | null = null;
  for (const t of trips) {
    if (latest === null || t.endDate > latest) latest = t.endDate;
  }
  return latest;
}

// 기록이 있는 모든 연도. 트립이 연도 경계를 가로지르면 양쪽 다 포함.
export async function loadAvailableYears(): Promise<number[]> {
  const trips = await listTrips();
  const years = new Set<number>();
  for (const t of trips) {
    const startYear = Number(t.startDate.slice(0, 4));
    const endYear = Number(t.endDate.slice(0, 4));
    for (let y = startYear; y <= endYear; y += 1) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

// 연도별 요약 — 일수, 고유 국가 수, 월별 일수.
// 트립을 펼쳐 (country, date)를 만들면 yearly·monthly·distinct-country 모두 단일 패스로 집계 가능.
export async function loadYearSummaries(): Promise<YearSummary[]> {
  const trips = await listTrips();
  const byYear = new Map<
    number,
    { days: number; countries: Set<string>; monthly: number[] }
  >();
  for (const t of trips) {
    for (const { countryCode, date } of expandTripDays(t)) {
      const year = Number(date.slice(0, 4));
      const month = Number(date.slice(5, 7)) - 1;
      if (!Number.isFinite(year) || month < 0 || month >= 12) continue;
      let entry = byYear.get(year);
      if (!entry) {
        entry = { days: 0, countries: new Set(), monthly: new Array(12).fill(0) };
        byYear.set(year, entry);
      }
      entry.days += 1;
      entry.countries.add(countryCode);
      entry.monthly[month] += 1;
    }
  }
  return [...byYear.entries()]
    .map(([year, e]) => ({
      year,
      days: e.days,
      countries: e.countries.size,
      monthly: e.monthly,
    }))
    .sort((a, b) => b.year - a.year);
}

// 트립 [start, end]와 [windowStart, windowEnd]의 겹치는 일수.
function overlapDays(
  t: Trip,
  windowStart: string,
  windowEnd: string
): number {
  const lo = t.startDate > windowStart ? t.startDate : windowStart;
  const hi = t.endDate < windowEnd ? t.endDate : windowEnd;
  if (lo > hi) return 0;
  return diffInDays(lo, hi) + 1;
}

