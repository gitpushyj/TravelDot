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
  refresh: () => Promise<void>;
};

// tier 0(free)은 미구독, 1·2(premium·power)는 구독 상태로 본다.
// 구독 처리 후엔 entitlementStore도 동기화해서 부가 기능 토글이 맞춰진다.
// 실제 상태는 useSubscriptionStore(글로벌 zustand)에서 관리하므로
// 여러 화면이 동시에 mount돼 있어도 subscribe 직후 즉시 함께 갱신된다.
export function useSubscription(): State {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const tier = useSubscriptionStore((s) => s.tier);
  const loading = useSubscriptionStore((s) => s.loading);
  const refreshStore = useSubscriptionStore((s) => s.refresh);
  const subscribeStore = useSubscriptionStore((s) => s.subscribe);
  const syncFromUserId = useEntitlementStore((s) => s.syncFromUserId);

  const refresh = useCallback(() => refreshStore(userId), [userId, refreshStore]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const subscribe = useCallback(
    async (plan: PlanId) => {
      if (!userId) throw new Error("not_signed_in");
      await subscribeStore(userId, plan);
      await syncFromUserId(userId);
    },
    [userId, subscribeStore, syncFromUserId]
  );

  return {
    tier,
    isSubscribed: tier != null && tier !== "free",
    loading,
    subscribe,
    refresh,
  };
}
