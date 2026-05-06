import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import {
  loadAvailableYears,
  loadForeignPhotoCount,
  loadRecentTripsByCountry,
  loadTotalVisitDays,
  loadVisitCounts,
  loadVisitCountsByYear,
  markPhotosUserReviewed,
  RecentTrip,
  removeAutoVisitsForCountry,
  softDeletePhotosByIds,
  wipeAllVisits,
} from "./visitRepository";
import { SuspectTrip } from "../photoSync/deviceVerification";
import {
  HomeCountry,
  loadHomeCountry,
  loadHomeCountryChanged,
  markHomeCountryChanged,
  saveHomeCountry,
} from "./homeCountryStorage";
import { useBadgeStore } from "../badges/badgeStore";
import { COUNTRY_NAME_KO_BY_CODE } from "../badges/countryNames";

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
  /** 앱에서 한 번이라도 본국을 바꾼 적이 있는지. 일회용 메뉴 노출 여부에 사용. */
  homeChanged: boolean;
  visitCounts: Record<string, number>;
  visitCountsByYear: Record<number, Record<string, number>>;
  recentTrips: RecentTrip[];
  availableYears: number[];
  syncStatus: SyncStatus;
  lastSync: SyncReport | null;
  selectedCountry: SelectedCountry | null;
  homeCleanupReport: HomeCleanupReport | null;
  /** 다른 기기 사진만 있어 본인 여행이 맞는지 사용자 확인이 필요한 묶음들. */
  suspectTrips: SuspectTrip[];
  hydrate: () => Promise<void>;
  setHomeCountry: (c: HomeCountry) => Promise<void>;
  changeHomeCountry: (c: HomeCountry) => Promise<void>;
  refreshVisits: () => Promise<void>;
  /** 현재 visitCounts + DB 통계로부터 뱃지를 재평가한다 */
  evaluateBadges: () => Promise<void>;
  ensureYearCounts: (year: number) => Promise<void>;
  setSelectedCountry: (c: SelectedCountry | null) => void;
  setSyncStatus: (s: SyncStatus) => void;
  setLastSync: (r: SyncReport | null) => void;
  setHomeCleanupReport: (r: HomeCleanupReport | null) => void;
  setSuspectTrips: (trips: SuspectTrip[]) => void;
  /** 의심 여행 거부 — 해당 사진들을 soft-delete하고 visit 통계 재로드. */
  rejectSuspectTrip: (trip: SuspectTrip) => Promise<void>;
  /** 단건 인정 — 한 묶음만 user_reviewed로 표시하고 목록에서 제거. */
  acceptSuspectTrip: (trip: SuspectTrip) => Promise<void>;
  /** 의심 여행 인정 — 해당 사진들을 user_reviewed로 표시해 다음 리뷰에서 제외. */
  acceptSuspectTrips: (trips: SuspectTrip[]) => Promise<void>;
};

export const useVisitStore = create<State>((set, get) => ({
  ready: false,
  homeCountry: null,
  homeChanged: false,
  visitCounts: {},
  visitCountsByYear: {},
  recentTrips: [],
  availableYears: [],
  syncStatus: { running: false, processed: 0 },
  lastSync: null,
  selectedCountry: null,
  homeCleanupReport: null,
  suspectTrips: [],
  hydrate: async () => {
    // 뱃지 스토어는 visitStore보다 먼저 hydrate되어야 한다 — 첫 evaluate에서
    // seeded 플래그를 정확히 읽어 retroactive 알림을 묵음 처리하기 위함.
    if (!useBadgeStore.getState().hydrated) {
      await useBadgeStore.getState().hydrate();
    }
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
    const [counts, trips, years, homeChanged] = await Promise.all([
      loadVisitCounts(),
      loadRecentTripsByCountry(),
      loadAvailableYears(),
      loadHomeCountryChanged(),
    ]);
    set({
      ready: true,
      homeCountry: home,
      homeChanged,
      visitCounts: counts,
      recentTrips: trips,
      availableYears: years,
      selectedCountry: home ? { code: home.code, name: home.name } : null,
      homeCleanupReport: cleanupReport,
    });
    // 첫 평가는 ready=true 이후에 수행. 뱃지 스토어는 App.tsx에서 hydrate 완료를 보장한다.
    await get().evaluateBadges();
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
    // 본국이 바뀌면 해외 사진 기준이 달라지므로 항상 재평가한다.
    await get().evaluateBadges();
  },
  // 일회용 "본국 바꾸기": 모든 방문 기록을 비우고 새 본국으로 다시 시작한다.
  // 호출 측에서 이어서 runFullSync로 재스캔을 트리거한다.
  changeHomeCountry: async (c) => {
    await wipeAllVisits();
    await saveHomeCountry(c);
    await markHomeCountryChanged();
    // 새 본국에 대해서는 자동 누적분이 처음부터 없으므로 cleanup 플래그를 done으로 유지.
    await AsyncStorage.setItem(HOME_AUTO_CLEANUP_FLAG, "done");
    set({
      homeCountry: c,
      homeChanged: true,
      selectedCountry: { code: c.code, name: c.name },
      visitCounts: {},
      visitCountsByYear: {},
      recentTrips: [],
      availableYears: [],
      homeCleanupReport: null,
      suspectTrips: [],
    });
    await get().evaluateBadges();
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
    await get().evaluateBadges();
  },
  evaluateBadges: async () => {
    const { visitCounts, homeCountry } = get();
    // 본국이 설정되기 전에는 "해외 사진" 기준이 의미가 없어 잘못된 상태로 시드될 수
    // 있다. 온보딩에서 본국 설정 직후 setHomeCountry가 평가를 다시 트리거하므로
    // 여기서는 그냥 건너뛴다.
    if (!homeCountry) return;
    const totalDays = Object.values(visitCounts).reduce((s, n) => s + n, 0);
    const foreignPhotoCount = await loadForeignPhotoCount(homeCountry.code);
    // visit_days 전체 행 수 = totalDays(visitCounts 합)와 같지만, 향후 일자 중복 제거 정책이
    // 갈라질 수 있으니 DB 값을 권위 자료로 한 번 더 확인한다.
    const dbDays = await loadTotalVisitDays();
    await useBadgeStore.getState().evaluate(
      {
        visitedCountriesCount: Object.keys(visitCounts).length,
        totalDays: Math.max(totalDays, dbDays),
        daysByCountry: visitCounts,
        foreignPhotoCount,
      },
      COUNTRY_NAME_KO_BY_CODE
    );
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
  setSuspectTrips: (trips) => set({ suspectTrips: trips }),
  rejectSuspectTrip: async (trip) => {
    await softDeletePhotosByIds(trip.photoIds);
    set((s) => ({
      suspectTrips: s.suspectTrips.filter(
        (t) =>
          !(
            t.countryCode === trip.countryCode &&
            t.startDate === trip.startDate &&
            t.endDate === trip.endDate
          )
      ),
    }));
    await get().refreshVisits();
  },
  acceptSuspectTrip: async (trip) => {
    await markPhotosUserReviewed(trip.photoIds);
    set((s) => ({
      suspectTrips: s.suspectTrips.filter(
        (t) =>
          !(
            t.countryCode === trip.countryCode &&
            t.startDate === trip.startDate &&
            t.endDate === trip.endDate
          )
      ),
    }));
  },
  acceptSuspectTrips: async (trips) => {
    if (trips.length === 0) return;
    const ids = trips.flatMap((t) => t.photoIds);
    await markPhotosUserReviewed(ids);
    const keys = new Set(
      trips.map((t) => `${t.countryCode}|${t.startDate}|${t.endDate}`)
    );
    set((s) => ({
      suspectTrips: s.suspectTrips.filter(
        (t) => !keys.has(`${t.countryCode}|${t.startDate}|${t.endDate}`)
      ),
    }));
  },
}));
