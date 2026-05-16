import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "./supabase";

// 마지막으로 last_active_at 갱신을 시도한 시각을 로컬에 캐싱한다.
// AsyncStorage 키는 앱 전역에서 단일이므로 user 전환 시에도 안전하게 덮어쓴다.
const STORAGE_KEY = "lastActive.lastSentAt";
const THROTTLE_MS = 30 * 60 * 1000; // 30분

// 30분 throttle로 public.users.last_active_at을 now()로 갱신한다.
// userId가 falsy이거나 throttle window 안이면 no-op. 네트워크/DB 실패는 조용히 삼킨다 —
// 활동 기록이 한두 번 누락돼도 사용자 경험에 영향이 없고, 다음 호출에서 자연스레 복구된다.
export async function touchLastActive(userId: string | null): Promise<void> {
  if (!userId) return;

  const now = Date.now();
  try {
    const prevRaw = await AsyncStorage.getItem(STORAGE_KEY);
    const prev = prevRaw ? Number(prevRaw) : 0;
    if (Number.isFinite(prev) && now - prev < THROTTLE_MS) return;
  } catch {
    // AsyncStorage 읽기 실패 시에는 throttle을 건너뛰고 한 번 갱신을 시도한다.
  }

  const { error } = await supabase
    .from("users")
    .update({ last_active_at: new Date(now).toISOString() })
    .eq("id", userId);

  if (error) return;

  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(now));
  } catch {
    // 캐시 쓰기 실패는 무시 — 다음 호출 시 한 번 더 DB를 칠 뿐이다.
  }
}
