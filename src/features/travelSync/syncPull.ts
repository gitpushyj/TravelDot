import { getTripDb } from "../travel/trip/tripDb";
import { pullRemoteTripsSince, type RemoteTripRow } from "./remoteRepository";

export type PullResult = {
  pulled: number;
  newLastPulledAtMs: number | null;
};

// sinceMs 이후 갱신된 원격 row를 가져와 로컬에 LWW로 머지한다.
// sinceMs == null이면 전체 가져옴 (재설치 후 첫 pull).
export async function pullRemoteTrips(input: {
  sinceMs: number | null;
}): Promise<PullResult> {
  const remote = await pullRemoteTripsSince(input.sinceMs);
  if (remote.length === 0) {
    return { pulled: 0, newLastPulledAtMs: input.sinceMs };
  }
  await mergeRemoteRowsLocally(remote);

  let newest = input.sinceMs ?? 0;
  for (const r of remote) {
    const ms = Date.parse(r.updated_at);
    if (ms > newest) newest = ms;
  }
  return {
    pulled: remote.length,
    newLastPulledAtMs: newest > 0 ? newest : null,
  };
}

// LWW 머지: 로컬에 같은 id가 있고 로컬 updated_at이 server보다 크거나 같으면 덮지 않는다.
// soft-delete된 server row도 그대로 적용 (deleted_at 전파).
async function mergeRemoteRowsLocally(rows: RemoteTripRow[]): Promise<void> {
  if (rows.length === 0) return;
  const db = await getTripDb();
  await db.withTransactionAsync(async () => {
    for (const r of rows) {
      const updatedMs = Date.parse(r.updated_at);
      const createdMs = Date.parse(r.created_at);
      const deletedMs = r.deleted_at == null ? null : Date.parse(r.deleted_at);
      await db.runAsync(
        `INSERT INTO trips
           (id, country_code, start_date, end_date, body, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           country_code = excluded.country_code,
           start_date   = excluded.start_date,
           end_date     = excluded.end_date,
           body         = excluded.body,
           created_at   = excluded.created_at,
           updated_at   = excluded.updated_at,
           deleted_at   = excluded.deleted_at
         WHERE excluded.updated_at > trips.updated_at`,
        r.id,
        r.country_code,
        r.start_date,
        r.end_date,
        r.body,
        createdMs,
        updatedMs,
        deletedMs
      );
    }
  });
}
