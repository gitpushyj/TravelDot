import { create } from "zustand";

import { loadVisitCounts } from "./visitRepository";
import {
  HomeCountry,
  loadHomeCountry,
  saveHomeCountry,
} from "./homeCountryStorage";

type SyncStatus = { running: boolean; processed: number };

type State = {
  ready: boolean;
  homeCountry: HomeCountry | null;
  visitCounts: Record<string, number>;
  syncStatus: SyncStatus;
  hydrate: () => Promise<void>;
  setHomeCountry: (c: HomeCountry) => Promise<void>;
  refreshVisits: () => Promise<void>;
  setSyncStatus: (s: SyncStatus) => void;
};

export const useVisitStore = create<State>((set) => ({
  ready: false,
  homeCountry: null,
  visitCounts: {},
  syncStatus: { running: false, processed: 0 },
  hydrate: async () => {
    const [home, counts] = await Promise.all([
      loadHomeCountry(),
      loadVisitCounts(),
    ]);
    set({ ready: true, homeCountry: home, visitCounts: counts });
  },
  setHomeCountry: async (c) => {
    await saveHomeCountry(c);
    set({ homeCountry: c });
  },
  refreshVisits: async () => {
    const counts = await loadVisitCounts();
    set({ visitCounts: counts });
  },
  setSyncStatus: (s) => set({ syncStatus: s }),
}));
