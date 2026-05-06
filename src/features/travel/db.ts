import * as SQLite from "expo-sqlite";

let _db: SQLite.SQLiteDatabase | null = null;

// 개발 단계에서 스키마를 재설계하면서 기존 visitgrid.db는 버리고
// 새 파일 이름으로 시작한다. 마이그레이션은 추후 정식 출시 전에 도입.
const DB_NAME = "visitgrid_v2.db";

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS visit_days (
      country_code TEXT NOT NULL,
      date         TEXT NOT NULL,
      updated_at   INTEGER NOT NULL,
      deleted_at   INTEGER,
      PRIMARY KEY (country_code, date)
    );

    CREATE TABLE IF NOT EXISTS visit_notes (
      id           TEXT PRIMARY KEY,
      country_code TEXT NOT NULL,
      date         TEXT NOT NULL,
      body         TEXT NOT NULL,
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL,
      deleted_at   INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_visit_notes_country_date
      ON visit_notes (country_code, date);

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
      device_checked_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_visit_photos_country_date
      ON visit_photos (country_code, date);
  `);
  await ensureColumn(db, "visit_days", "deleted_at", "deleted_at INTEGER");
  await ensureColumn(db, "visit_notes", "deleted_at", "deleted_at INTEGER");
  await ensureColumn(db, "visit_photos", "deleted_at", "deleted_at INTEGER");
  await ensureColumn(db, "visit_photos", "device_make", "device_make TEXT");
  await ensureColumn(db, "visit_photos", "device_model", "device_model TEXT");
  await ensureColumn(
    db,
    "visit_photos",
    "device_checked_at",
    "device_checked_at INTEGER"
  );
  // 사용자가 "다른 기기 사진이지만 내 여행 맞음"으로 확인한 시각.
  // 채워져 있으면 의심 여행 리뷰에서 제외된다.
  await ensureColumn(
    db,
    "visit_photos",
    "user_reviewed_at",
    "user_reviewed_at INTEGER"
  );
  _db = db;
  return db;
}

// CREATE TABLE IF NOT EXISTS는 첫 생성 시에만 적용되므로,
// 기존 사용자의 DB에는 ALTER TABLE로 컬럼을 따로 채워줘야 한다.
async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  ddl: string
): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`
  );
  if (cols.some((c) => c.name === column)) return;
  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}
