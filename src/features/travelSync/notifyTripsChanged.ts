import { useSyncStore } from "./syncStore";

// 트립 변경 직후 호출. push를 fire-and-forget으로 트리거한다.
// 동시 호출이나 미로그인 상태는 syncStore가 내부에서 처리한다.
// 호출 측을 막지 않도록 promise를 await하지 않고, rejection은 silent로 흡수.
export function notifyTripsChanged(): void {
  void useSyncStore
    .getState()
    .requestSyncPush()
    .catch(() => {
      // 실패는 syncStore.lastError에 기록되어 호출 측이 별도로 await할 필요 없음.
    });
}
