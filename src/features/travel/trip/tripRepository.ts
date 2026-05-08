import { getTripDb } from "./tripDb";
import { newTripId } from "./tripId";
import { rowToTrip, type Trip, type TripRow } from "./tripTypes";

const SELECT_COLS = `id, country_code, start_date, end_date, body, created_at, updated_at, deleted_at`;

export async function createTrip(input: {
  countryCode: string;
  startDate: string;
  endDate: string;
  body?: string | null;
}): Promise<Trip> {
  if (input.startDate > input.endDate) {
    throw new Error("createTrip: startDate after endDate");
  }
  const db = await getTripDb();
  const id = newTripId();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO trips (id, country_code, start_date, end_date, body, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.countryCode,
    input.startDate,
    input.endDate,
    input.body ?? null,
    now,
    now
  );
  return {
    id,
    countryCode: input.countryCode,
    startDate: input.startDate,
    endDate: input.endDate,
    body: input.body ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateTripDates(input: {
  id: string;
  startDate: string;
  endDate: string;
}): Promise<void> {
  if (input.startDate > input.endDate) {
    throw new Error("updateTripDates: startDate after endDate");
  }
  const db = await getTripDb();
  await db.runAsync(
    `UPDATE trips SET start_date = ?, end_date = ?, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL`,
    input.startDate,
    input.endDate,
    Date.now(),
    input.id
  );
}

export async function updateTripBody(
  id: string,
  body: string | null
): Promise<void> {
  const db = await getTripDb();
  await db.runAsync(
    `UPDATE trips SET body = ?, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL`,
    body,
    Date.now(),
    id
  );
}

export async function softDeleteTrip(id: string): Promise<void> {
  const db = await getTripDb();
  const now = Date.now();
  await db.runAsync(
    `UPDATE trips SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL`,
    now,
    now,
    id
  );
}

export async function getTripById(id: string): Promise<Trip | null> {
  const db = await getTripDb();
  const row = await db.getFirstAsync<TripRow>(
    `SELECT ${SELECT_COLS} FROM trips
      WHERE id = ? AND deleted_at IS NULL`,
    id
  );
  return row ? rowToTrip(row) : null;
}

export async function listTrips(): Promise<Trip[]> {
  const db = await getTripDb();
  const rows = await db.getAllAsync<TripRow>(
    `SELECT ${SELECT_COLS} FROM trips
      WHERE deleted_at IS NULL
      ORDER BY start_date DESC, id DESC`
  );
  return rows.map(rowToTrip);
}

export async function listTripsByCountry(
  countryCode: string
): Promise<Trip[]> {
  const db = await getTripDb();
  const rows = await db.getAllAsync<TripRow>(
    `SELECT ${SELECT_COLS} FROM trips
      WHERE country_code = ? AND deleted_at IS NULL
      ORDER BY start_date DESC`,
    countryCode
  );
  return rows.map(rowToTrip);
}
