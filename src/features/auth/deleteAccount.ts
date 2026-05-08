import { wipeAllLocalData } from "../dev/wipeAllLocalData";
import { purgeAllVisits } from "../travel/visitRepository";
import { supabase } from "../../lib/supabase";

/**
 * Supabase Edge Function을 호출해 서버 측 계정 데이터를 삭제하고
 * 로컬 데이터까지 모두 비운다. App Store Review Guideline 5.1.1(v) 준수용.
 *
 * 흐름:
 *  1. Edge Function `delete-account` 호출 (auth.users 삭제 → public.users CASCADE)
 *  2. 로컬 SQLite/AsyncStorage/zustand 상태 초기화 + 로그아웃
 *  3. soft-delete로 남은 trip 행을 hard delete — 다음 계정의 첫 push에
 *     tombstone(deleted_at)이 누설되는 걸 막는다.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke("delete-account", {
    method: "POST",
  });
  if (error) {
    // 서버 삭제가 실패하면 로컬도 건드리지 않는다 — 사용자가 다시 시도할 수 있도록.
    throw error;
  }

  // 서버에서 유저가 사라졌으므로 로컬 흔적도 모두 정리한다.
  // wipeAllLocalData가 내부에서 supabase.auth.signOut도 호출한다.
  await wipeAllLocalData();
  await purgeAllVisits();
}
