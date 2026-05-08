import { getTripDb } from "../travel/trip/tripDb";
import { listLocalTripsForPush } from "./localPushFetch";
import { upsertRemoteTrips, type RemoteTripRow } from "./remoteRepository";

export type PushResult = {
  pushed: number;
  newLastPushedAtMs: number | null;
};

// 로컬 변경분(updated_at > sinceMs)을 원격에 upsert하고,
// 응답으로 받은 server timestamps를 로컬에 sync한다.
// sinceMs == null이면 전체 트립 push (재설치 후 첫 push 시나리오).
//
// race-safe: push 도중 사용자가 같은 트립을 또 변경하면(updated_at가 server보다 큼)
// 로컬 timestamps를 덮지 않는다. 그 변경분은 다음 push 사이클에서 잡힌다.
export async function pushPendingTrips(input: {
  userId: string;
  sinceMs: number | null;
}): Promise<PushResult> {
  const candidates = await listLocalTripsForPush(input.sinceMs);
  if (candidates.length === 0) {
    return { pushed: 0, newLastPushedAtMs: input.sinceMs };
  }
  const payload = candidates.map((c) => ({
    id: c.id,
    country_code: c.country_code,
    start_date: c.start_date,
    end_date: c.end_date,
    body: c.body,
    deleted_at: c.deleted_at,
  }));
  const remote = await upsertRemoteTrips(input.userId, payload);
  await applyServerTimestampsLocally(remote);

  let newest = input.sinceMs ?? 0;
  for (const r of remote) {
    const ms = Date.parse(r.updated_at);
    if (ms > newest) newest = ms;
  }
  return {
    pushed: remote.length,
    newLastPushedAtMs: newest > 0 ? newest : null,
  };
}

async function applyServerTimestampsLocally(
  rows: RemoteTripRow[]
): Promise<void> {
  if (rows.length === 0) return;
  const db = await getTripDb();
  await db.withTransactionAsync(async () => {
    for (const r of rows) {
      const updatedMs = Date.parse(r.updated_at);
      const createdMs = Date.parse(r.created_at);
      const deletedMs = r.deleted_at == null ? null : Date.parse(r.deleted_at);
      // 로컬이 push 직후 또 변경됐으면(updated_at > updatedMs) 덮지 않는다.
      // 그 행은 다음 push에 자연스럽게 다시 잡힘.
      await db.runAsync(
        `UPDATE trips
            SET created_at = ?, updated_at = ?, deleted_at = ?
          WHERE id = ? AND updated_at <= ?`,
        createdMs,
        updatedMs,
        deletedMs,
        r.id,
        updatedMs
      );
    }
  });
}
