import { getDb } from "../db";

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
