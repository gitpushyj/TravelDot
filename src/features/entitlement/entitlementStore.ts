import { create } from "zustand";

import { fetchUserTier } from "../auth/userTier";
import { setAllMilestoneVisibleProperty } from "../../lib/analyticsEvents";
import {
  loadIsAllMilestoneVisible,
  saveIsAllMilestoneVisible,
} from "./entitlementStorage";

type State = {
  isAllMilestoneVisible: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAllMilestoneVisible: (value: boolean) => Promise<void>;
  syncFromUserId: (userId: string) => Promise<void>;
};

export const useEntitlementStore = create<State>((set) => ({
  isAllMilestoneVisible: false,
  hydrated: false,
  hydrate: async () => {
    const v = await loadIsAllMilestoneVisible();
    set({ isAllMilestoneVisible: v, hydrated: true });
    setAllMilestoneVisibleProperty(v);
  },
  setAllMilestoneVisible: async (value) => {
    set({ isAllMilestoneVisible: value });
    await saveIsAllMilestoneVisible(value);
    setAllMilestoneVisibleProperty(value);
  },
  syncFromUserId: async (userId) => {
    try {
      const tier = await fetchUserTier(userId);
      const next = tier !== "free";
      set({ isAllMilestoneVisible: next });
      await saveIsAllMilestoneVisible(next);
      setAllMilestoneVisibleProperty(next);
    } catch {
      // 네트워크/DB 실패 시 현재 값을 유지한다.
    }
  },
}));
