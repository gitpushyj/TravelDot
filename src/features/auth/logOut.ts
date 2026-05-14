import { wipeAllLocalData } from "../dev/wipeAllLocalData";
import { pushPendingTrips } from "../travelSync/syncPush";
import { useAuthStore } from "./authStore";

// 로그아웃 = 인증 해제 + 이 기기의 모든 로컬 데이터 제거.
// 로컬 SQLite(trips/visit_photos)는 계정별로 분리돼 있지 않아, 비우지 않으면
// 다음에 로그인하는 계정과 데이터가 섞인다. 서버(Supabase)는 건드리지 않는다.
export async function logOutAndWipeLocal(): Promise<void> {
  // wipe 전에 미동기화 trip을 한 번 밀어올린다 — 유료 사용자의 미반영분 보호.
  // 오프라인 등으로 실패해도 로그아웃 자체는 계속 진행한다(best-effort).
  const userId = useAuthStore.getState().user?.id;
  if (userId) {
    try {
      await pushPendingTrips({ userId });
    } catch {
      // 네트워크 오류 등은 무시한다.
    }
  }
  // signOut + SQLite/AsyncStorage/zustand 초기화까지 모두 처리한다.
  await wipeAllLocalData();
}
