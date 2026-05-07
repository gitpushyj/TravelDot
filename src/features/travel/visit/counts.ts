import { getDb } from "../db";
import type { YearSummary } from "./types";

export async function loadVisitCounts(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ country_code: string; days: number }>(
    `SELECT country_code, COUNT(*) AS days
       FROM visit_days
      WHERE deleted_at IS NULL
      GROUP BY country_code`
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.country_code] = r.days;
  return out;
}

export async function loadVisitCountsByYear(
  year: number
): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ country_code: string; days: number }>(
    `SELECT country_code, COUNT(*) AS days
       FROM visit_days
      WHERE substr(date, 1, 4) = ? AND deleted_at IS NULL
      GROUP BY country_code`,
    String(year)
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.country_code] = r.days;
  return out;
}

export async function loadTotalVisitDays(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM visit_days WHERE deleted_at IS NULL`
  );
  return row?.n ?? 0;
}

export async function loadForeignPhotoCount(
  homeCode: string | null
): Promise<number> {
  const db = await getDb();
  if (!homeCode) {
    const row = await db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) AS n FROM visit_photos WHERE deleted_at IS NULL`
    );
    return row?.n ?? 0;
  }
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM visit_photos
       WHERE country_code != ? AND deleted_at IS NULL`,
    homeCode
  );
  return row?.n ?? 0;
}

export async function loadLatestVisitDate(): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ d: string | null }>(
    `SELECT MAX(date) AS d FROM visit_days WHERE deleted_at IS NULL`
  );
  return row?.d ?? null;
}

export async function loadAvailableYears(): Promise<number[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ y: string }>(
    `SELECT DISTINCT substr(date, 1, 4) AS y
       FROM visit_days
      WHERE deleted_at IS NULL
      ORDER BY y DESC`
  );
  return rows.map((r) => Number(r.y)).filter((n) => Number.isFinite(n));
}

// 연도 선택 다이얼로그용. 기록이 있는 모든 연/월의 일수와 연도별 고유 국가 수를 함께 가져온다.
export async function loadYearSummaries(): Promise<YearSummary[]> {
  const db = await getDb();
  const monthRows = await db.getAllAsync<{
    y: string;
    m: string;
    days: number;
  }>(
    `SELECT substr(date, 1, 4) AS y, substr(date, 6, 2) AS m, COUNT(*) AS days
       FROM visit_days
      WHERE deleted_at IS NULL
      GROUP BY y, m`
  );
  const countryRows = await db.getAllAsync<{ y: string; countries: number }>(
    `SELECT substr(date, 1, 4) AS y, COUNT(DISTINCT country_code) AS countries
       FROM visit_days
      WHERE deleted_at IS NULL
      GROUP BY y`
  );
  const map = new Map<number, YearSummary>();
  for (const r of monthRows) {
    const year = Number(r.y);
    const idx = Number(r.m) - 1;
    if (!Number.isFinite(year) || idx < 0 || idx >= 12) continue;
    const entry =
      map.get(year) ??
      { year, days: 0, countries: 0, monthly: new Array(12).fill(0) };
    entry.monthly[idx] = r.days;
    entry.days += r.days;
    map.set(year, entry);
  }
  for (const r of countryRows) {
    const year = Number(r.y);
    const entry = map.get(year);
    if (entry) entry.countries = r.countries;
  }
  return [...map.values()].sort((a, b) => b.year - a.year);
}

export async function countPhotosForCountry(
  countryCode: string
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM visit_photos
       WHERE country_code = ? AND deleted_at IS NULL`,
    countryCode
  );
  return row?.n ?? 0;
}

export async function countPhotosForTrip(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM visit_photos
       WHERE country_code = ?
         AND date BETWEEN ? AND ?
         AND deleted_at IS NULL`,
    countryCode,
    startDate,
    endDate
  );
  return row?.n ?? 0;
}

export async function countPhotosForDay(
  countryCode: string,
  date: string
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM visit_photos
       WHERE country_code = ? AND date = ? AND deleted_at IS NULL`,
    countryCode,
    date
  );
  return row?.n ?? 0;
}
