import { create } from "zustand";

import {
  loadAvailableYears,
  loadRecentTripsByCountry,
  loadVisitCounts,
  loadVisitCountsByYear,
  RecentTrip,
} from "./visitRepository";
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
  // 진단용 표본: 첫 GPS 사진의 좌표와 매칭 시도 결과
  sample?: {
    lat: number;
    lng: number;
    code: string | null;
    bboxHits: number;
    totalFeatures: number;
  };
  error?: string;
};

export type SelectedCountry = { code: string; name: string };

type State = {
  ready: boolean;
  homeCountry: HomeCountry | null;
  visitCounts: Record<string, number>;
  visitCountsByYear: Record<number, Record<string, number>>;
  recentTrips: RecentTrip[];
  availableYears: number[];
  syncStatus: SyncStatus;
  lastSync: SyncReport | null;
  selectedCountry: SelectedCountry | null;
  hydrate: () => Promise<void>;
  setHomeCountry: (c: HomeCountry) => Promise<void>;
  refreshVisits: () => Promise<void>;
  ensureYearCounts: (year: number) => Promise<void>;
  setSelectedCountry: (c: SelectedCountry | null) => void;
  setSyncStatus: (s: SyncStatus) => void;
  setLastSync: (r: SyncReport | null) => void;
};

export const useVisitStore = create<State>((set, get) => ({
  ready: false,
  homeCountry: null,
  visitCounts: {},
  visitCountsByYear: {},
  recentTrips: [],
  availableYears: [],
  syncStatus: { running: false, processed: 0 },
  lastSync: null,
  selectedCountry: null,
  hydrate: async () => {
    const [home, counts, trips, years] = await Promise.all([
      loadHomeCountry(),
      loadVisitCounts(),
      loadRecentTripsByCountry(),
      loadAvailableYears(),
    ]);
    set({
      ready: true,
      homeCountry: home,
      visitCounts: counts,
      recentTrips: trips,
      availableYears: years,
      selectedCountry: home ? { code: home.code, name: home.name } : null,
    });
  },
  setHomeCountry: async (c) => {
    await saveHomeCountry(c);
    set((s) => ({
      homeCountry: c,
      selectedCountry: s.selectedCountry ?? { code: c.code, name: c.name },
    }));
  },
  setSelectedCountry: (c) => set({ selectedCountry: c }),
  refreshVisits: async () => {
    const [counts, trips, years] = await Promise.all([
      loadVisitCounts(),
      loadRecentTripsByCountry(),
      loadAvailableYears(),
    ]);
    set({
      visitCounts: counts,
      recentTrips: trips,
      availableYears: years,
      visitCountsByYear: {}, // 캐시 무효화
    });
  },
  ensureYearCounts: async (year) => {
    if (get().visitCountsByYear[year]) return;
    const counts = await loadVisitCountsByYear(year);
    set((s) => ({
      visitCountsByYear: { ...s.visitCountsByYear, [year]: counts },
    }));
  },
  setSyncStatus: (s) => set({ syncStatus: s }),
  setLastSync: (r) => set({ lastSync: r }),
}));
