import { create } from "zustand";

import { loadIsPremium, saveIsPremium } from "./entitlementStorage";

type State = {
  isPremium: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPremium: (value: boolean) => Promise<void>;
};

export const useEntitlementStore = create<State>((set) => ({
  isPremium: false,
  hydrated: false,
  hydrate: async () => {
    const v = await loadIsPremium();
    set({ isPremium: v, hydrated: true });
  },
  setPremium: async (value) => {
    set({ isPremium: value });
    await saveIsPremium(value);
  },
}));
