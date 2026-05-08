import { notifyTripsChanged } from "../../travelSync/notifyTripsChanged";
import { getTripDb } from "./tripDb";
import { ingestVisitDay } from "./tripIngest";

// 새 모델은 트립 한 줄당 메모(body)가 최대 1개다.
// 기존 호출 측은 noteId로 식별하던 시그니처를 그대로 받기 때문에,
// 가짜 id 형식 `note|{tripId}`로 호환을 유지한다.
// id를 다른 곳과 비교하거나 저장하는 용도가 없으니 식별만 가능하면 충분.

export type VisitNote = {
  id: string;
  countryCode: string;
  date: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

const NOTE_ID_PREFIX = "note|";
const noteIdFor = (tripId: string) => `${NOTE_ID_PREFIX}${tripId}`;

function parseNoteId(id: string): string | null {
  if (!id.startsWith(NOTE_ID_PREFIX)) return null;
  const tripId = id.slice(NOTE_ID_PREFIX.length);
  return tripId.length > 0 ? tripId : null;
}

type TripBodyRow = {
  id: string;
  country_code: string;
  start_date: string;
  body: string | null;
  created_at: number;
  updated_at: number;
};

function rowToNote(r: TripBodyRow): VisitNote | null {
  if (r.body == null || r.body.length === 0) return null;
  return {
    id: noteIdFor(r.id),
    countryCode: r.country_code,
    // 트립 한 줄 = 메모 한 개라 노트의 표시용 날짜는 트립 시작일로 통일.
    date: r.start_date,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// (country, date)를 포함하는 트립의 메모를 단일 원소 배열로 반환. 없으면 [].
export async function listNotes(
  countryCode: string,
  date: string
): Promise<VisitNote[]> {
  const db = await getTripDb();
  const row = await db.getFirstAsync<TripBodyRow>(
    `SELECT id, country_code, start_date, body, created_at, updated_at
       FROM trips
      WHERE country_code = ? AND deleted_at IS NULL
        AND start_date <= ? AND end_date >= ?
      LIMIT 1`,
    countryCode,
    date,
    date
  );
  if (!row) return [];
  const note = rowToNote(row);
  return note ? [note] : [];
}

export async function loadLatestNoteForTrip(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<VisitNote | null> {
  const db = await getTripDb();
  const row = await db.getFirstAsync<TripBodyRow>(
    `SELECT id, country_code, start_date, body, created_at, updated_at
       FROM trips
      WHERE country_code = ? AND deleted_at IS NULL
        AND start_date = ? AND end_date = ?
      LIMIT 1`,
    countryCode,
    startDate,
    endDate
  );
  return row ? rowToNote(row) : null;
}

// 메모 upsert. 새 모델에선 id 인자는 무시되고 (country, date) 기준 트립의 body로 갱신된다.
// 트립이 없으면 ingestVisitDay로 단일일 트립을 만든 뒤 채운다.
export async function upsertNote(note: {
  id: string; // 호환용. 새 모델에선 사용 안 함.
  countryCode: string;
  date: string;
  body: string;
}): Promise<void> {
  const db = await getTripDb();
  const ingest = await ingestVisitDay({
    countryCode: note.countryCode,
    date: note.date,
  });
  await db.runAsync(
    `UPDATE trips SET body = ?, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL`,
    note.body,
    Date.now(),
    ingest.tripId
  );
  notifyTripsChanged();
}

// 가짜 id에서 trip id를 파싱해 그 트립의 body를 비운다.
// 트립 자체는 유지된다.
export async function deleteNote(id: string): Promise<void> {
  const tripId = parseNoteId(id);
  if (!tripId) return;
  const db = await getTripDb();
  await db.runAsync(
    `UPDATE trips SET body = NULL, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL`,
    Date.now(),
    tripId
  );
  notifyTripsChanged();
}
