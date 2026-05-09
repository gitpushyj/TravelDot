import { getTripDb } from "../travel/trip/tripDb";
import { listLocalTripsForPush, type LocalTripForPush } from "./localPushFetch";
import { upsertRemoteTrips } from "./remoteRepository";

export type PushResult = {
  pushed: number;
};

// dirty 행(last_synced_updated_at != updated_at)을 원격에 upsert한 뒤,
// "push 시점에 캡처해둔 updated_at가 지금도 그대로인 행"만 clean 처리한다.
// push 도중 사용자가 같은 행을 또 만졌으면(updated_at 변경) clean 처리에서 제외되어
// 다음 push 사이클에서 다시 picked up.
//
// 시계는 모두 로컬 단일 프레임으로만 비교하므로 디바이스↔서버 시계 skew와 무관.
export async function pushPendingTrips(input: {
  userId: string;
}): Promise<PushResult> {
  const candidates = await listLocalTripsForPush();
  if (candidates.length === 0) {
    return { pushed: 0 };
  }
  const payload = candidates.map((c) => ({
    id: c.id,
    country_code: c.country_code,
    start_date: c.start_date,
    end_date: c.end_date,
    body: c.body,
    deleted_at: c.deleted_at,
  }));
  await upsertRemoteTrips(input.userId, payload);
  await markPushedRowsClean(candidates);
  return { pushed: candidates.length };
}

async function markPushedRowsClean(
  candidates: LocalTripForPush[]
): Promise<void> {
  if (candidates.length === 0) return;
  const db = await getTripDb();
  await db.withTransactionAsync(async () => {
    for (const c of candidates) {
      // updated_at가 캡처값과 같을 때만 clean. 다르면 push 도중 또 변경됐다는 뜻이므로
      // dirty로 두고 다음 사이클에서 다시 push되도록 한다.
      await db.runAsync(
        `UPDATE trips
            SET last_synced_updated_at = ?
          WHERE id = ? AND updated_at = ?`,
        c.capturedUpdatedAtMs,
        c.id,
        c.capturedUpdatedAtMs
      );
    }
  });
}
