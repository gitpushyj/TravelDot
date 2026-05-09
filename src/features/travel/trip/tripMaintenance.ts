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
  const r = await db.runAsync(
    `UPDATE visit_photos
        SET deleted_at = ?, updated_at = ?
      WHERE country_code = ? AND source = 'auto' AND deleted_at IS NULL`,
    now,
    now,
    countryCode
  );
  const { tripsDeleted } = await softDeleteEmptyTripsForCountry(countryCode);
  return { photosDeleted: r.changes, daysDeleted: tripsDeleted };
}

// 한 country의 트립 중 살아있는 사진/노트(body)가 모두 비어 있는 것을 soft-delete.
// 의심 여행 reject나 본국 정리처럼 사진을 비운 직후 빈 껍데기 트립을 같이
// 정리하기 위한 헬퍼. trips.deleted_at은 sync push로 전파되므로 호출만 해두면
// 로컬 화면에서 사라지고 다음 push에서 서버에도 전파된다.
export async function softDeleteEmptyTripsForCountry(
  countryCode: string
): Promise<{ tripsDeleted: number }> {
  const db = await getTripDb();
  const now = Date.now();
  let tripsDeleted = 0;
  await db.withTransactionAsync(async () => {
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
      const r = await db.runAsync(
        `UPDATE trips SET deleted_at = ?, updated_at = ? WHERE id = ?`,
        now,
        now,
        t.id
      );
      tripsDeleted += r.changes;
    }
  });
  if (tripsDeleted > 0) notifyTripsChanged();
  return { tripsDeleted };
}
