import { useEffect } from "react";
import { AppState } from "react-native";
import type { CustomerInfo } from "react-native-purchases";

import {
  addCustomerInfoListener,
  getCurrentCustomerInfo,
  hasActivePremium,
} from "../../lib/revenuecat";
import { saveIsAllMilestoneVisible } from "../entitlement/entitlementStorage";
import { useEntitlementStore } from "../entitlement/entitlementStore";
import { useSubscriptionStore } from "./subscriptionStore";

// RC customerInfo가 truth source. DB(public.users.tier)는 webhook delay가 있어
// 결제 직후 fetch하면 아직 free일 수 있다. RC entitlement가 active면 그것을
// 신뢰하고, inactive일 때만 DB로 refresh해서 free/premium 구분.
function applyCustomerInfo(userId: string, info: CustomerInfo | null): void {
  if (info && hasActivePremium(info)) {
    useSubscriptionStore.setState({ tier: "premium" });
    useEntitlementStore.setState({ isAllMilestoneVisible: true });
    void saveIsAllMilestoneVisible(true);
    return;
  }
  // RC entitlement inactive — 만료 또는 미결제. DB 값으로 결정한다.
  void useSubscriptionStore.getState().refresh(userId);
  void useEntitlementStore.getState().syncFromUserId(userId);
}

// 결제 만료/취소 후 client의 tier·호칭이 stale 상태로 남는 문제를 막는다.
// RC SDK가 영수증 변화를 감지하면 즉시, 그리고 앱이 foreground로 돌아올 때마다
// customerInfo를 다시 읽어 zustand store를 갱신한다.
// userId가 null이면(로그아웃) listener를 등록하지 않는다.
export function useTierAutoSync(userId: string | null): void {
  useEffect(() => {
    if (!userId) return;

    const unsubRc = addCustomerInfoListener((info) =>
      applyCustomerInfo(userId, info)
    );
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void getCurrentCustomerInfo().then((info) =>
        applyCustomerInfo(userId, info)
      );
    });

    return () => {
      unsubRc();
      appStateSub.remove();
    };
  }, [userId]);
}
