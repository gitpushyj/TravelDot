import { getDb } from "./db";

// 무료 사용자의 일별 사진 저장 한도. 추후 유료 tier 도입 시 함수로 분기.
export const PHOTO_LIMIT_PER_DAY = 5;

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

export type YearSummary = {
  year: number;
  days: number;
  countries: number;
  monthly: number[]; // length 12, days per month
};

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
    `SELECT country_code, date
       FROM visit_days
      WHERE deleted_at IS NULL
      ORDER BY country_code, date`
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

export type TripPhoto = {
  id: string;
  countryCode: string;
  date: string;
  localUri: string;
  takenAt: number;
  source: "auto" | "manual";
};

export async function loadPhotosForTrip(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<TripPhoto[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    country_code: string;
    date: string;
    local_uri: string | null;
    taken_at: number;
    source: "auto" | "manual";
  }>(
    `SELECT id, country_code, date, local_uri, taken_at, source
       FROM visit_photos
      WHERE country_code = ?
        AND date BETWEEN ? AND ?
        AND deleted_at IS NULL
        AND local_uri IS NOT NULL
      ORDER BY taken_at ASC`,
    countryCode,
    startDate,
    endDate
  );
  return rows
    .filter((r) => !!r.local_uri)
    .map((r) => ({
      id: r.id,
      countryCode: r.country_code,
      date: r.date,
      localUri: r.local_uri as string,
      takenAt: r.taken_at,
      source: r.source,
    }));
}

export async function loadLatestNoteForTrip(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<VisitNote | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: string;
    country_code: string;
    date: string;
    body: string;
    created_at: number;
    updated_at: number;
  }>(
    `SELECT id, country_code, date, body, created_at, updated_at
       FROM visit_notes
      WHERE country_code = ?
        AND date BETWEEN ? AND ?
        AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT 1`,
    countryCode,
    startDate,
    endDate
  );
  if (!row) return null;
  return {
    id: row.id,
    countryCode: row.country_code,
    date: row.date,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

// (country, date) 그룹별로 PHOTO_LIMIT_PER_DAY 제한을 강제하면서 일괄 INSERT한다.
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
      const slots = Math.max(0, PHOTO_LIMIT_PER_DAY - existing);
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
      WHERE country_code = ? AND date = ? AND deleted_at IS NULL
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
       ON CONFLICT(id) DO UPDATE SET
         body = excluded.body,
         updated_at = excluded.updated_at,
         deleted_at = NULL`,
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
  await db.runAsync(
    `UPDATE visit_notes SET deleted_at = ?, updated_at = ? WHERE id = ?`,
    Date.now(),
    Date.now(),
    id
  );
}

// "본국 바꾸기"용 — 모든 방문 기록을 비운다.
export async function wipeAllVisits(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM visit_photos`);
    await db.runAsync(`DELETE FROM visit_notes`);
    await db.runAsync(`DELETE FROM visit_days`);
  });
}

// 본국이 자동 동기화에서 제외되도록 정책이 바뀌면서, 이미 들어간 자동 사진을
// 정리한다. 사용자가 직접 고른 manual 사진과 노트가 달린 날짜는 보존한다.
export async function removeAutoVisitsForCountry(
  countryCode: string
): Promise<{ photosDeleted: number; daysDeleted: number }> {
  const db = await getDb();
  let photosDeleted = 0;
  let daysDeleted = 0;
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    const r1 = await db.runAsync(
      `UPDATE visit_photos
          SET deleted_at = ?, updated_at = ?
        WHERE country_code = ? AND source = 'auto' AND deleted_at IS NULL`,
      now,
      now,
      countryCode
    );
    photosDeleted = r1.changes;
    // 사용자가 직접 추가한 사진(manual)이나 노트가 살아있는 날짜는 visit_day도 보존.
    const r2 = await db.runAsync(
      `UPDATE visit_days
          SET deleted_at = ?, updated_at = ?
        WHERE country_code = ?
          AND deleted_at IS NULL
          AND date NOT IN (
            SELECT date FROM visit_photos
             WHERE country_code = ? AND deleted_at IS NULL
          )
          AND date NOT IN (
            SELECT date FROM visit_notes
             WHERE country_code = ? AND deleted_at IS NULL
          )`,
      now,
      now,
      countryCode,
      countryCode,
      countryCode
    );
    daysDeleted = r2.changes;
  });
  return { photosDeleted, daysDeleted };
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
     ON CONFLICT(country_code, date) DO UPDATE SET
       updated_at = excluded.updated_at,
       deleted_at = NULL`,
    countryCode,
    date,
    now
  );
}
