import { create } from "zustand";

import {
  loadMilestoneKind,
  saveMilestoneKind,
} from "./milestoneStorage";
import { DEFAULT_MILESTONE_KIND, MilestoneKind } from "./milestoneTypes";

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
    const stored = await loadMilestoneKind();
    set({ kind: stored ?? DEFAULT_MILESTONE_KIND, hydrated: true });
  },

  setKind: async (kind) => {
    set({ kind });
    await saveMilestoneKind(kind);
  },
}));
