import { getDb } from "../db";
import { ensureVisitDay } from "./internal";
import type { VisitNote } from "./types";

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
