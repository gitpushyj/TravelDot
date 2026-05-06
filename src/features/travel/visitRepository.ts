import { getDb } from "./db";

export type VisitPhotoInput = {
  id: string;
  countryCode: string;
  date: string; // YYYY-MM-DD
  photoUri: string;
  source: "auto" | "manual";
  takenAt: number;
};

export async function loadVisitCounts(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ country_code: string; days: number }>(
    `SELECT country_code, COUNT(*) AS days FROM visit_days GROUP BY country_code`
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.country_code] = r.days;
  return out;
}

export async function countPhotosForDay(
  countryCode: string,
  date: string
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM visit_photos WHERE country_code = ? AND date = ?`,
    countryCode,
    date
  );
  return row?.n ?? 0;
}

// 일별 최대 3장 제한을 앱 레이어에서 강제하면서 일괄 INSERT한다.
export async function addPhotos(inputs: VisitPhotoInput[]): Promise<number> {
  if (inputs.length === 0) return 0;
  const db = await getDb();
  let inserted = 0;
  await db.withTransactionAsync(async () => {
    const groups = new Map<string, VisitPhotoInput[]>();
    for (const i of inputs) {
      const k = `${i.countryCode}|${i.date}`;
      const arr = groups.get(k) ?? [];
      arr.push(i);
      groups.set(k, arr);
    }
    for (const [, items] of groups) {
      const { countryCode, date } = items[0];
      const existing = await countPhotosForDay(countryCode, date);
      const slots = Math.max(0, 3 - existing);
      const toInsert = items.slice(0, slots);
      if (toInsert.length === 0) continue;
      await db.runAsync(
        `INSERT OR IGNORE INTO visit_days (country_code, date) VALUES (?, ?)`,
        countryCode,
        date
      );
      for (const ph of toInsert) {
        const r = await db.runAsync(
          `INSERT OR IGNORE INTO visit_photos
             (id, country_code, date, photo_uri, source, taken_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          ph.id,
          ph.countryCode,
          ph.date,
          ph.photoUri,
          ph.source,
          ph.takenAt
        );
        if (r.changes > 0) inserted += 1;
      }
    }
  });
  return inserted;
}
