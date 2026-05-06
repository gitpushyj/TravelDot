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

export async function loadVisitCountsByYear(
  year: number
): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ country_code: string; days: number }>(
    `SELECT country_code, COUNT(*) AS days
       FROM visit_days
      WHERE substr(date, 1, 4) = ?
      GROUP BY country_code`,
    String(year)
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.country_code] = r.days;
  return out;
}

export async function loadAvailableYears(): Promise<number[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ y: string }>(
    `SELECT DISTINCT substr(date, 1, 4) AS y FROM visit_days ORDER BY y DESC`
  );
  return rows.map((r) => Number(r.y)).filter((n) => Number.isFinite(n));
}

export type RecentTrip = {
  countryCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  days: number;
};

// 나라별 가장 최근 "여행" = 마지막 날짜에서 거꾸로 거슬러 올라가며 연속된 날짜의 묶음.
// 결과는 시작일 기준 내림차순 정렬.
export async function loadRecentTripsByCountry(): Promise<RecentTrip[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ country_code: string; date: string }>(
    `SELECT country_code, date FROM visit_days ORDER BY country_code, date`
  );
  const byCountry = new Map<string, string[]>();
  for (const r of rows) {
    const arr = byCountry.get(r.country_code) ?? [];
    arr.push(r.date);
    byCountry.set(r.country_code, arr);
  }
  const trips: RecentTrip[] = [];
  for (const [code, dates] of byCountry) {
    if (dates.length === 0) continue;
    // dates는 ASC. 마지막에서부터 연속 구간을 찾는다.
    const endDate = dates[dates.length - 1];
    let startDate = endDate;
    let i = dates.length - 2;
    while (i >= 0 && diffInDays(dates[i], startDate) === 1) {
      startDate = dates[i];
      i -= 1;
    }
    const days = diffInDays(startDate, endDate) + 1;
    trips.push({ countryCode: code, startDate, endDate, days });
  }
  trips.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  return trips;
}

function diffInDays(a: string, b: string): number {
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
