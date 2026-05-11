import { create } from "zustand";

import { fetchUserTier } from "../auth/userTier";
import type { TierName } from "../aiChat/types";

import type { PlanId } from "./plans";
import { activateSubscription, restoreSubscription } from "./subscriptionService";

type State = {
  tier: TierName | null; // null = 아직 모름
  loading: boolean;
  refresh: (userId: string | null) => Promise<void>;
  subscribe: (userId: string, plan: PlanId) => Promise<void>;
  restore: () => Promise<boolean>; // true = 활성 구독 복원됨
};

// tier 상태를 zustand 글로벌 store로 관리한다.
// hook 단위 useState로 두면 SubscriptionScreen에서 subscribe 후
// SettingsScreen 등 다른 화면이 즉시 갱신되지 않는다.
//
// 결제/복원은 RevenueCat이 처리하고, 서버 tier(public.users.tier)는 RC webhook이 갱신한다.
// webhook 도착 전 free 화면이 잠깐 보이는 깜빡임을 막기 위해 client는 결제 성공 즉시
// tier="premium"으로 낙관적 갱신하고, 백그라운드 fetchUserTier로 server 값과 정합성을 맞춘다.
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
      // 결제 직후 fetchUserTier로 다시 덮어쓰지 않는다. webhook이 늦게 도착하면
      // DB는 아직 tier=0이라 낙관적 "premium"을 free로 되돌려버린다.
      // RC customerInfo listener(useTierAutoSync)가 webhook 도착 후 자동 sync.
      set({ tier: "premium" });
    } finally {
      set({ loading: false });
    }
  },
  restore: async () => {
    set({ loading: true });
    try {
      const restored = await restoreSubscription();
      if (restored) {
        set({ tier: "premium" });
      }
      return restored;
    } finally {
      set({ loading: false });
    }
  },
}));
