import { useCallback, useEffect, useState } from "react";

import { useAuthStore } from "../auth/authStore";
import { fetchUserTier } from "../auth/userTier";
import type { TierName } from "../aiChat/types";
import { useEntitlementStore } from "../entitlement/entitlementStore";

import type { PlanId } from "./plans";
import { activateSubscription } from "./subscriptionService";

type State = {
  tier: TierName | null;        // null = 아직 모름
  isSubscribed: boolean;        // tier가 free가 아니면 true
  loading: boolean;
  subscribe: (plan: PlanId) => Promise<void>;
  refresh: () => Promise<void>;
};

// tier 0(free)은 미구독, 1·2(premium·power)는 구독 상태로 본다.
// 구독 처리 후엔 entitlementStore도 동기화해서 부가 기능 토글이 맞춰진다.
export function useSubscription(): State {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const syncFromUserId = useEntitlementStore((s) => s.syncFromUserId);

  const [tier, setTier] = useState<TierName | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setTier(null);
      return;
    }
    const next = await fetchUserTier(userId);
    setTier(next);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const subscribe = useCallback(
    async (plan: PlanId) => {
      if (!userId) throw new Error("not_signed_in");
      setLoading(true);
      try {
        await activateSubscription(userId, plan);
        await refresh();
        await syncFromUserId(userId);
      } finally {
        setLoading(false);
      }
    },
    [userId, refresh, syncFromUserId]
  );

  return {
    tier,
    isSubscribed: tier != null && tier !== "free",
    loading,
    subscribe,
    refresh,
  };
}
