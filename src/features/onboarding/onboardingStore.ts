import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "visitgrid:onboarding:completed_v1";

type State = {
  hydrated: boolean;
  completed: boolean;
  hydrate: () => Promise<void>;
  markCompleted: () => Promise<void>;
};

export const useOnboardingStore = create<State>((set) => ({
  hydrated: false,
  completed: false,
  hydrate: async () => {
    let stored: string | null = null;
    try {
      stored = await AsyncStorage.getItem(STORAGE_KEY);
    } catch {}
    set({ hydrated: true, completed: stored === "1" });
  },
  markCompleted: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    set({ completed: true });
  },
}));
