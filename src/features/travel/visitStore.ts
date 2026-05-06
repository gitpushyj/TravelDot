import { create } from "zustand";

import { loadVisitCounts } from "./visitRepository";
import {
  HomeCountry,
  loadHomeCountry,
  saveHomeCountry,
} from "./homeCountryStorage";

type SyncStatus = { running: boolean; processed: number };

export type SyncReport = {
  permission: "granted" | "limited" | "denied";
  scanned: number;
  withGps: number;
  resolved: number; // 좌표→국가 매칭 성공
  added: number; // DB에 새로 들어간 visit_photos 건수
  error?: string;
};

type State = {
  ready: boolean;
  homeCountry: HomeCountry | null;
  visitCounts: Record<string, number>;
  syncStatus: SyncStatus;
  lastSync: SyncReport | null;
  hydrate: () => Promise<void>;
  setHomeCountry: (c: HomeCountry) => Promise<void>;
  refreshVisits: () => Promise<void>;
  setSyncStatus: (s: SyncStatus) => void;
  setLastSync: (r: SyncReport | null) => void;
};

export const useVisitStore = create<State>((set) => ({
  ready: false,
  homeCountry: null,
  visitCounts: {},
  syncStatus: { running: false, processed: 0 },
  lastSync: null,
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
  setLastSync: (r) => set({ lastSync: r }),
}));
