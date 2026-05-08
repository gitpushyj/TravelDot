import { getDb } from "../db";

export { addOneDay, diffInDays } from "./dateUtils";

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
