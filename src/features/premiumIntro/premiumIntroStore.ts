import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "visitgrid:premiumIntro:seen_v1";

type State = {
  hydrated: boolean;
  /** 프리미엄 기능 안내 페이지를 이미 봤는지 여부. 설치 1회만 노출하기 위한 플래그. */
  seen: boolean;
  hydrate: () => Promise<void>;
  markSeen: () => Promise<void>;
};

export const usePremiumIntroStore = create<State>((set, get) => ({
  hydrated: false,
  seen: false,
  hydrate: async () => {
    let seen = false;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      seen = raw === "1";
    } catch {}
    set({ hydrated: true, seen });
  },
  markSeen: async () => {
    if (get().seen) return;
    set({ seen: true });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  },
}));
