import * as SQLite from "expo-sqlite";

// 새 데이터 모델 (트립 한 줄 + 사진)을 위한 별도 DB 파일.
// 기존 visitgrid_v2.db와 분리해 점진적으로 갈아끼울 수 있게 한다.
const DB_NAME = "traveldot_v1.db";

let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getTripDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_dbPromise) {
    _dbPromise = openAndInit().catch((e) => {
      _dbPromise = null;
      throw e;
    });
  }
  return _dbPromise;
}

async function openAndInit(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS trips (
      id           TEXT PRIMARY KEY,
      country_code TEXT NOT NULL,
      start_date   TEXT NOT NULL,
      end_date     TEXT NOT NULL,
      body         TEXT,
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL,
      deleted_at   INTEGER,
      CHECK (start_date <= end_date)
    );
    CREATE INDEX IF NOT EXISTS idx_trips_country_start
      ON trips (country_code, start_date);
    CREATE INDEX IF NOT EXISTS idx_trips_updated_at
      ON trips (updated_at);

    CREATE TABLE IF NOT EXISTS visit_photos (
      id           TEXT PRIMARY KEY,
      country_code TEXT NOT NULL,
      date         TEXT NOT NULL,
      local_uri    TEXT,
      remote_url   TEXT,
      source       TEXT NOT NULL,
      taken_at     INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL,
      deleted_at   INTEGER,
      device_make  TEXT,
      device_model TEXT,
      device_checked_at INTEGER,
      user_reviewed_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_visit_photos_country_date
      ON visit_photos (country_code, date);
  `);
  return db;
}
