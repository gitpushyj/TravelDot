import { getTripDb } from "./tripDb";

// visit_photos 카운트는 새 DB(traveldot_v1.db)의 visit_photos 테이블을 그대로 쓴다.
// 사진 자체는 sync 대상이 아니지만 트립 표시·뱃지에 카운트가 필요하다.

export async function countPhotosForCountry(
  countryCode: string
): Promise<number> {
  const db = await getTripDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM visit_photos
       WHERE country_code = ? AND deleted_at IS NULL`,
    countryCode
  );
  return row?.n ?? 0;
}

export async function countPhotosForTrip(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const db = await getTripDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM visit_photos
       WHERE country_code = ?
         AND date BETWEEN ? AND ?
         AND deleted_at IS NULL`,
    countryCode,
    startDate,
    endDate
  );
  return row?.n ?? 0;
}

export async function countPhotosForDay(
  countryCode: string,
  date: string
): Promise<number> {
  const db = await getTripDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM visit_photos
       WHERE country_code = ? AND date = ? AND deleted_at IS NULL`,
    countryCode,
    date
  );
  return row?.n ?? 0;
}

// 본국 외 국가에서 찍힌 사진 수. 본국이 없으면 전체 사진 수.
// 뱃지 평가용으로 쓰인다.
export async function loadForeignPhotoCount(
  homeCode: string | null
): Promise<number> {
  const db = await getTripDb();
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
