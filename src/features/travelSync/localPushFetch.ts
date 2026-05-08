import { getTripDb } from "../travel/trip/tripDb";
import type { LocalTripPushPayload } from "./remoteRepository";

export type LocalTripForPush = LocalTripPushPayload & {
  updatedAtMs: number;
};

// sinceMs보다 updated_at이 큰 로컬 트립을 push 후보로 가져온다.
// soft-delete된 행도 포함해야 원격에 deleted_at가 전파된다.
// sinceMs == null이면 전체 트립을 반환 (재설치 후 첫 push 등).
export async function listLocalTripsForPush(
  sinceMs: number | null
): Promise<LocalTripForPush[]> {
  const db = await getTripDb();
  const sql = `
    SELECT id, country_code, start_date, end_date, body, deleted_at, updated_at
      FROM trips
     ${sinceMs == null ? "" : "WHERE updated_at > ?"}
     ORDER BY updated_at ASC
  `;
  const rows =
    sinceMs == null
      ? await db.getAllAsync<{
          id: string;
          country_code: string;
          start_date: string;
          end_date: string;
          body: string | null;
          deleted_at: number | null;
          updated_at: number;
        }>(sql)
      : await db.getAllAsync<{
          id: string;
          country_code: string;
          start_date: string;
          end_date: string;
          body: string | null;
          deleted_at: number | null;
          updated_at: number;
        }>(sql, sinceMs);

  return rows.map((r) => ({
    id: r.id,
    country_code: r.country_code,
    start_date: r.start_date,
    end_date: r.end_date,
    body: r.body,
    // 로컬은 ms (INTEGER), 원격은 timestamptz(ISO). 경계에서 변환.
    deleted_at: r.deleted_at == null ? null : new Date(r.deleted_at).toISOString(),
    updatedAtMs: r.updated_at,
  }));
}
