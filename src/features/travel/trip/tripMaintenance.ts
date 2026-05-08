import { notifyTripsChanged } from "../../travelSync/notifyTripsChanged";
import { getTripDb } from "./tripDb";

// "본국 바꾸기" 등 — 모든 방문 기록을 비운다.
// trips는 soft-delete (deleted_at 채움)해 sync에 deleted_at 전파.
// visit_photos는 sync 대상이 아니므로 hard delete.
export async function wipeAllVisits(): Promise<void> {
  const db = await getTripDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM visit_photos`);
    await db.runAsync(
      `UPDATE trips SET deleted_at = ?, updated_at = ?
        WHERE deleted_at IS NULL`,
      now,
      now
    );
  });
  notifyTripsChanged();
}

// 계정 삭제 시 사용. 서버 데이터는 Edge Function이 이미 hard delete했고
// 다음 sync 전파가 필요 없으므로 trips도 물리 삭제한다. soft-delete된 행을
// 남기면 다음 계정의 첫 push에 tombstone이 누설된다.
export async function purgeAllVisits(): Promise<void> {
  const db = await getTripDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM visit_photos`);
    await db.runAsync(`DELETE FROM trips`);
  });
  notifyTripsChanged();
}

// 본국이 자동 동기화에서 제외된 정책에 따라, 이미 들어간 자동 사진을 정리한다.
// 사용자가 직접 추가한 manual 사진이 남아있는 (country, date)는 보존하고,
// 트립은 "그 기간 안에 살아있는 사진/노트가 하나도 없으면" soft-delete한다.
export async function removeAutoVisitsForCountry(
  countryCode: string
): Promise<{ photosDeleted: number; daysDeleted: number }> {
  const db = await getTripDb();
  const now = Date.now();
  let photosDeleted = 0;
  let daysDeleted = 0;
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

    // 그 country의 트립 중에서 (사진/노트가 모두 비어 있는) 트립을 찾아 soft-delete.
    // - body가 NULL/빈 문자열
    // - 트립 [start, end] 범위에 살아있는 manual 사진이 0
    const candidateTrips = await db.getAllAsync<{
      id: string;
      start_date: string;
      end_date: string;
      body: string | null;
    }>(
      `SELECT id, start_date, end_date, body FROM trips
        WHERE country_code = ? AND deleted_at IS NULL`,
      countryCode
    );
    for (const t of candidateTrips) {
      if (t.body && t.body.length > 0) continue;
      const surviving = await db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) AS n FROM visit_photos
          WHERE country_code = ?
            AND date BETWEEN ? AND ?
            AND deleted_at IS NULL`,
        countryCode,
        t.start_date,
        t.end_date
      );
      if ((surviving?.n ?? 0) > 0) continue;
      const r2 = await db.runAsync(
        `UPDATE trips SET deleted_at = ?, updated_at = ? WHERE id = ?`,
        now,
        now,
        t.id
      );
      daysDeleted += r2.changes;
    }
  });
  if (daysDeleted > 0) notifyTripsChanged();
  return { photosDeleted, daysDeleted };
}
