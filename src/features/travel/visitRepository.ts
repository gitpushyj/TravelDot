import { getDb } from "./db";

export type VisitPhotoInput = {
  id: string;
  countryCode: string;
  date: string; // YYYY-MM-DD
  localUri: string;
  source: "auto" | "manual";
  takenAt: number;
};

export type VisitNote = {
  id: string;
  countryCode: string;
  date: string; // YYYY-MM-DD
  body: string;
  createdAt: number;
  updatedAt: number;
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

// (country, date) 그룹별로 일별 3장 제한을 강제하면서 일괄 INSERT한다.
export async function addPhotos(inputs: VisitPhotoInput[]): Promise<number> {
  if (inputs.length === 0) return 0;
  const db = await getDb();
  const now = Date.now();
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
      await ensureVisitDay(countryCode, date, now);
      for (const ph of toInsert) {
        const r = await db.runAsync(
          `INSERT OR IGNORE INTO visit_photos
             (id, country_code, date, local_uri, remote_url, source, taken_at, updated_at)
           VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`,
          ph.id,
          ph.countryCode,
          ph.date,
          ph.localUri,
          ph.source,
          ph.takenAt,
          now
        );
        if (r.changes > 0) inserted += 1;
      }
    }
  });
  return inserted;
}

export async function listNotes(
  countryCode: string,
  date: string
): Promise<VisitNote[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    country_code: string;
    date: string;
    body: string;
    created_at: number;
    updated_at: number;
  }>(
    `SELECT id, country_code, date, body, created_at, updated_at
       FROM visit_notes
      WHERE country_code = ? AND date = ?
      ORDER BY created_at ASC`,
    countryCode,
    date
  );
  return rows.map((r) => ({
    id: r.id,
    countryCode: r.country_code,
    date: r.date,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function upsertNote(note: {
  id: string;
  countryCode: string;
  date: string;
  body: string;
}): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    await ensureVisitDay(note.countryCode, note.date, now);
    await db.runAsync(
      `INSERT INTO visit_notes (id, country_code, date, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`,
      note.id,
      note.countryCode,
      note.date,
      note.body,
      now,
      now
    );
  });
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM visit_notes WHERE id = ?`, id);
}

async function ensureVisitDay(
  countryCode: string,
  date: string,
  now: number
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO visit_days (country_code, date, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(country_code, date) DO UPDATE SET updated_at = excluded.updated_at`,
    countryCode,
    date,
    now
  );
}
