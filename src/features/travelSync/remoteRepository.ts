import { supabase } from "../../lib/supabase";

// 원격 trips row 형태. 로컬 Trip과 다른 점은 created_at/updated_at가 timestamptz(ISO)라는 점.
// 변환은 sync 경계(syncService)에서 ms로 일원화한다.
export type RemoteTripRow = {
  id: string;
  user_id: string;
  country_code: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  body: string | null;
  created_at: string; // ISO
  updated_at: string;
  deleted_at: string | null;
};

// push 시 클라가 보내는 컬럼. created_at/updated_at는 서버가 default/trigger로 채우므로
// 클라는 보내지 않는다. user_id는 upsert 직전에 채운다.
export type LocalTripPushPayload = {
  id: string;
  country_code: string;
  start_date: string;
  end_date: string;
  body: string | null;
  deleted_at: string | null;
};

// 다수 행 upsert. 서버가 created_at/updated_at를 자동 갱신하고, RLS가 user_id 검증.
// 응답으로 받은 row를 호출 측이 로컬 timestamps와 동기화한다.
export async function upsertRemoteTrips(
  userId: string,
  trips: LocalTripPushPayload[]
): Promise<RemoteTripRow[]> {
  if (trips.length === 0) return [];
  const payload = trips.map((t) => ({ ...t, user_id: userId }));
  const { data, error } = await supabase
    .from("trips")
    .upsert(payload, { onConflict: "id" })
    .select();
  if (error) throw error;
  return (data ?? []) as RemoteTripRow[];
}

// 증분 pull. sinceMs가 null이면 전체. RLS가 본인 행만 반환하므로 별도 user_id 필터 불필요.
export async function pullRemoteTripsSince(
  sinceMs: number | null
): Promise<RemoteTripRow[]> {
  let q = supabase.from("trips").select("*");
  if (sinceMs !== null) {
    q = q.gt("updated_at", new Date(sinceMs).toISOString());
  }
  const { data, error } = await q.order("updated_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RemoteTripRow[];
}
