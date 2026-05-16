import { useEffect } from "react";
import { AppState } from "react-native";

import { touchLastActive } from "../../lib/lastActive";

// 로그인된 사용자의 public.users.last_active_at을 앱 시작 및 foreground 진입 시 갱신한다.
// 실제 DB 호출은 lastActive.ts의 30분 throttle을 거치므로 잦은 active 전환에도 부하가 없다.
// userId가 null이면 listener를 등록하지 않는다.
export function useTrackLastActive(userId: string | null): void {
  useEffect(() => {
    if (!userId) return;

    void touchLastActive(userId);

    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void touchLastActive(userId);
    });

    return () => {
      sub.remove();
    };
  }, [userId]);
}
