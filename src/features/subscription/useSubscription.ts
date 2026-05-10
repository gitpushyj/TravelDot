import { useCallback, useEffect } from "react";

import { useAuthStore } from "../auth/authStore";
import type { TierName } from "../aiChat/types";
import { useEntitlementStore } from "../entitlement/entitlementStore";

import type { PlanId } from "./plans";
import { useSubscriptionStore } from "./subscriptionStore";

type State = {
  tier: TierName | null;        // null = 아직 모름
  isSubscribed: boolean;        // tier가 free가 아니면 true
  loading: boolean;
  subscribe: (plan: PlanId) => Promise<void>;
  restore: () => Promise<boolean>; // true = 활성 구독 복원됨
  refresh: () => Promise<void>;
};

// tier 0(free)은 미구독, 1·2(premium·power)는 구독 상태로 본다.
// 실제 상태는 useSubscriptionStore(글로벌 zustand)에서 관리하므로 여러 화면이
// 동시에 mount돼 있어도 subscribe/restore 직후 즉시 함께 갱신된다.
// 결제/복원은 RevenueCat이 담당하며, 서버 tier는 RC webhook이 갱신한다.
export function useSubscription(): State {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const tier = useSubscriptionStore((s) => s.tier);
  const loading = useSubscriptionStore((s) => s.loading);
  const refreshStore = useSubscriptionStore((s) => s.refresh);
  const subscribeStore = useSubscriptionStore((s) => s.subscribe);
  const restoreStore = useSubscriptionStore((s) => s.restore);
  const setAllMilestoneVisible = useEntitlementStore(
    (s) => s.setAllMilestoneVisible
  );

  const refresh = useCallback(() => refreshStore(userId), [userId, refreshStore]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const subscribe = useCallback(
    async (plan: PlanId) => {
      if (!userId) throw new Error("not_signed_in");
      await subscribeStore(userId, plan);
      // RC entitlement는 active. webhook 도착 전이라도 client 측 entitlement도 즉시 활성화.
      await setAllMilestoneVisible(true);
    },
    [userId, subscribeStore, setAllMilestoneVisible]
  );

  const restore = useCallback(async () => {
    const restored = await restoreStore();
    if (restored) {
      await setAllMilestoneVisible(true);
    }
    return restored;
  }, [restoreStore, setAllMilestoneVisible]);

  return {
    tier,
    isSubscribed: tier != null && tier !== "free",
    loading,
    subscribe,
    restore,
    refresh,
  };
}
