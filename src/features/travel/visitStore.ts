import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import {
  loadAvailableYears,
  loadRecentTripsByCountry,
  loadVisitCounts,
  loadVisitCountsByYear,
  RecentTrip,
  removeAutoVisitsForCountry,
} from "./visitRepository";
import {
  HomeCountry,
  loadHomeCountry,
  saveHomeCountry,
} from "./homeCountryStorage";

const HOME_AUTO_CLEANUP_FLAG = "visitgrid:migration:autoHomeCleanup_v1";

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

export type HomeCleanupReport = {
  countryCode: string;
  photosDeleted: number;
  daysDeleted: number;
};

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
  homeCleanupReport: HomeCleanupReport | null;
  hydrate: () => Promise<void>;
  setHomeCountry: (c: HomeCountry) => Promise<void>;
  refreshVisits: () => Promise<void>;
  ensureYearCounts: (year: number) => Promise<void>;
  setSelectedCountry: (c: SelectedCountry | null) => void;
  setSyncStatus: (s: SyncStatus) => void;
  setLastSync: (r: SyncReport | null) => void;
  setHomeCleanupReport: (r: HomeCleanupReport | null) => void;
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
  homeCleanupReport: null,
  hydrate: async () => {
    const home = await loadHomeCountry();
    // 본국은 더 이상 자동 동기화에서 추가되지 않는다. 기존 사용자에게 남아있는
    // 자동 누적분을 1회만 정리하고, 정리 결과는 UI에서 알림으로 보여준다.
    let cleanupReport: HomeCleanupReport | null = null;
    if (home) {
      const flag = await AsyncStorage.getItem(HOME_AUTO_CLEANUP_FLAG);
      if (flag !== "done") {
        const r = await removeAutoVisitsForCountry(home.code);
        await AsyncStorage.setItem(HOME_AUTO_CLEANUP_FLAG, "done");
        if (r.photosDeleted > 0 || r.daysDeleted > 0) {
          cleanupReport = { countryCode: home.code, ...r };
        }
      }
    }
    const [counts, trips, years] = await Promise.all([
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
      homeCleanupReport: cleanupReport,
    });
  },
  setHomeCountry: async (c) => {
    await saveHomeCountry(c);
    // 본국이 새로 지정/변경되면 그 국가의 자동 누적분을 정리한다.
    const r = await removeAutoVisitsForCountry(c.code);
    await AsyncStorage.setItem(HOME_AUTO_CLEANUP_FLAG, "done");
    set((s) => ({
      homeCountry: c,
      selectedCountry: s.selectedCountry ?? { code: c.code, name: c.name },
      homeCleanupReport:
        r.photosDeleted > 0 || r.daysDeleted > 0
          ? { countryCode: c.code, ...r }
          : s.homeCleanupReport,
    }));
    if (r.photosDeleted > 0 || r.daysDeleted > 0) {
      const [counts, trips, years] = await Promise.all([
        loadVisitCounts(),
        loadRecentTripsByCountry(),
        loadAvailableYears(),
      ]);
      set({
        visitCounts: counts,
        recentTrips: trips,
        availableYears: years,
        visitCountsByYear: {},
      });
    }
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
  setHomeCleanupReport: (r) => set({ homeCleanupReport: r }),
}));
