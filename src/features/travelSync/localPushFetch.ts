import { getTripDb } from "../travel/trip/tripDb";
import type { LocalTripPushPayload } from "./remoteRepository";

export type LocalTripForPush = LocalTripPushPayload & {
  // push payload를 읽은 시점의 로컬 updated_at. 응답 처리 단계에서
  // "그 사이에 사용자가 같은 행을 또 만졌는지"를 판별하는 sequence number로 쓴다.
  // 시계 프레임을 섞지 않기 때문에 시계 skew와 무관하게 정확하다.
  capturedUpdatedAtMs: number;
};

// last_synced_updated_at != updated_at 인 행만 push 후보로 가져온다.
// (NULL = 한 번도 sync 안 됨, 그 외 = 마지막 sync 이후 로컬에서 다시 변경됨)
// soft-delete된 행도 포함해야 deleted_at가 원격에 전파된다.
export async function listLocalTripsForPush(): Promise<LocalTripForPush[]> {
  const db = await getTripDb();
  const rows = await db.getAllAsync<{
    id: string;
    country_code: string;
    start_date: string;
    end_date: string;
    body: string | null;
    deleted_at: number | null;
    updated_at: number;
  }>(
    `SELECT id, country_code, start_date, end_date, body, deleted_at, updated_at
       FROM trips
      WHERE last_synced_updated_at IS NULL
         OR last_synced_updated_at != updated_at
      ORDER BY updated_at ASC`
  );

  return rows.map((r) => ({
    id: r.id,
    country_code: r.country_code,
    start_date: r.start_date,
    end_date: r.end_date,
    body: r.body,
    // 로컬은 ms (INTEGER), 원격은 timestamptz(ISO). 경계에서 변환.
    deleted_at: r.deleted_at == null ? null : new Date(r.deleted_at).toISOString(),
    capturedUpdatedAtMs: r.updated_at,
  }));
}
