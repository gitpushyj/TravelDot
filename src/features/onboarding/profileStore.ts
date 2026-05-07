import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "visitgrid:userProfile_v1";

export type Gender = "male" | "female";

export type UserProfile = {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  gender: Gender;
};

type State = {
  hydrated: boolean;
  profile: UserProfile | null;
  hydrate: () => Promise<void>;
  setProfile: (p: UserProfile) => Promise<void>;
  clear: () => Promise<void>;
};

export const useProfileStore = create<State>((set) => ({
  hydrated: false,
  profile: null,
  hydrate: async () => {
    let raw: string | null = null;
    try {
      raw = await AsyncStorage.getItem(STORAGE_KEY);
    } catch {}
    let profile: UserProfile | null = null;
    if (raw) {
      try {
        profile = JSON.parse(raw) as UserProfile;
      } catch {}
    }
    set({ hydrated: true, profile });
  },
  setProfile: async (p) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {}
    set({ profile: p });
  },
  clear: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({ profile: null });
  },
}));
