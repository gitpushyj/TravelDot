import { useEffect } from "react";
import { AppState } from "react-native";

import { addCustomerInfoListener } from "../../lib/revenuecat";
import { useEntitlementStore } from "../entitlement/entitlementStore";
import { useSubscriptionStore } from "./subscriptionStore";

// 결제 만료/취소 후 client의 tier·호칭이 stale 상태로 남는 문제를 막는다.
// RC SDK가 영수증 변화를 감지하면 즉시, 그리고 앱이 foreground로 돌아올 때마다
// 서버 tier를 다시 fetch해서 zustand store를 갱신한다.
// userId가 null이면(로그아웃) listener를 등록하지 않는다.
export function useTierAutoSync(userId: string | null): void {
  useEffect(() => {
    if (!userId) return;

    const sync = () => {
      void useSubscriptionStore.getState().refresh(userId);
      void useEntitlementStore.getState().syncFromUserId(userId);
    };

    const unsubRc = addCustomerInfoListener(sync);
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });

    return () => {
      unsubRc();
      appStateSub.remove();
    };
  }, [userId]);
}
