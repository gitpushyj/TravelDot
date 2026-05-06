import * as SQLite from "expo-sqlite";

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  const db = await SQLite.openDatabaseAsync("visitgrid.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS visit_days (
      country_code TEXT NOT NULL,
      date TEXT NOT NULL,
      PRIMARY KEY (country_code, date)
    );
    CREATE TABLE IF NOT EXISTS visit_photos (
      id TEXT PRIMARY KEY,
      country_code TEXT NOT NULL,
      date TEXT NOT NULL,
      photo_uri TEXT NOT NULL,
      source TEXT NOT NULL,
      taken_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_visit_photos_country_date
      ON visit_photos (country_code, date);
  `);
  _db = db;
  return db;
}
