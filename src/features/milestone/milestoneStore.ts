import { create } from "zustand";

import { useEntitlementStore } from "../entitlement/entitlementStore";
import {
  loadMilestoneKind,
  saveMilestoneKind,
} from "./milestoneStorage";
import {
  DEFAULT_MILESTONE_KIND,
  isPremiumMilestoneKind,
  MilestoneKind,
} from "./milestoneTypes";

type State = {
  kind: MilestoneKind;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setKind: (kind: MilestoneKind) => Promise<void>;
};

export const useMilestoneStore = create<State>((set) => ({
  kind: DEFAULT_MILESTONE_KIND,
  hydrated: false,

  hydrate: async () => {
    // 저장된 마일스톤이 premium인데 사용자가 더 이상 premium이 아니라면
    // 기본값으로 폴백한다. entitlement 상태가 필요하므로 먼저 hydrate를
    // 보장한다(이미 hydrate된 경우 setItem 한 번이면 멱등).
    const entitlement = useEntitlementStore.getState();
    if (!entitlement.hydrated) {
      await entitlement.hydrate();
    }
    const isPremium = useEntitlementStore.getState().isPremium;
    const stored = await loadMilestoneKind();
    const resolved =
      stored && (!isPremiumMilestoneKind(stored) || isPremium)
        ? stored
        : DEFAULT_MILESTONE_KIND;
    set({ kind: resolved, hydrated: true });
  },

  setKind: async (kind) => {
    set({ kind });
    await saveMilestoneKind(kind);
  },
}));
