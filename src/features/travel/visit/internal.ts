import { getDb } from "../db";

export function diffInDays(a: string, b: string): number {
  // YYYY-MM-DD 가정. UTC로 변환해 일수만 계산.
  const da = Date.UTC(
    Number(a.slice(0, 4)),
    Number(a.slice(5, 7)) - 1,
    Number(a.slice(8, 10))
  );
  const db = Date.UTC(
    Number(b.slice(0, 4)),
    Number(b.slice(5, 7)) - 1,
    Number(b.slice(8, 10))
  );
  return Math.round((db - da) / 86400000);
}

export function addOneDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export async function ensureVisitDay(
  countryCode: string,
  date: string,
  now: number
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO visit_days (country_code, date, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(country_code, date) DO UPDATE SET
       updated_at = excluded.updated_at,
       deleted_at = NULL`,
    countryCode,
    date,
    now
  );
}
