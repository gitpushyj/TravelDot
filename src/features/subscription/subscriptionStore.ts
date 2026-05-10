import { create } from "zustand";

import { fetchUserTier } from "../auth/userTier";
import type { TierName } from "../aiChat/types";

import type { PlanId } from "./plans";
import { activateSubscription } from "./subscriptionService";

type State = {
  tier: TierName | null; // null = 아직 모름
  loading: boolean;
  refresh: (userId: string | null) => Promise<void>;
  subscribe: (userId: string, plan: PlanId) => Promise<void>;
};

// tier 상태를 zustand 글로벌 store로 관리한다.
// hook 단위 useState로 두면 SubscriptionScreen에서 subscribe 후
// SettingsScreen 등 다른 화면이 즉시 갱신되지 않는다.
export const useSubscriptionStore = create<State>((set) => ({
  tier: null,
  loading: false,
  refresh: async (userId) => {
    if (!userId) {
      set({ tier: null });
      return;
    }
    const next = await fetchUserTier(userId);
    set({ tier: next });
  },
  subscribe: async (userId, plan) => {
    set({ loading: true });
    try {
      await activateSubscription(userId, plan);
      const next = await fetchUserTier(userId);
      set({ tier: next });
    } finally {
      set({ loading: false });
    }
  },
}));
