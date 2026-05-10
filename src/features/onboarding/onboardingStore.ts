import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "visitgrid:onboarding:completed_v1";
const LAST_STEP_KEY = "visitgrid:onboarding:lastStep_v1";

const MIN_STEP = 1;
const MAX_STEP = 5;

type State = {
  hydrated: boolean;
  completed: boolean;
  /**
   * 사용자가 마지막으로 머물렀던 onboarding step.
   * 0 = 진입한 적 없음 또는 완료. 1..5 = mid-flow.
   * App.tsx의 자동 완료 분기에서 mid-flow 사용자를 식별하고,
   * OnboardingFlow가 재진입 시 같은 step으로 복원하기 위해 사용한다.
   */
  lastStep: number;
  hydrate: () => Promise<void>;
  markCompleted: () => Promise<void>;
  setLastStep: (step: number) => Promise<void>;
};

export const useOnboardingStore = create<State>((set, get) => ({
  hydrated: false,
  completed: false,
  lastStep: 0,
  hydrate: async () => {
    let completed = false;
    let lastStep = 0;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      completed = raw === "1";
    } catch {}
    if (!completed) {
      try {
        const raw = await AsyncStorage.getItem(LAST_STEP_KEY);
        if (raw) {
          const n = Number(raw);
          if (Number.isFinite(n) && n >= MIN_STEP && n <= MAX_STEP) {
            lastStep = n;
          }
        }
      } catch {}
    }
    set({ hydrated: true, completed, lastStep });
  },
  markCompleted: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "1");
      await AsyncStorage.removeItem(LAST_STEP_KEY);
    } catch {}
    set({ completed: true, lastStep: 0 });
  },
  setLastStep: async (step) => {
    if (!Number.isFinite(step) || step < MIN_STEP || step > MAX_STEP) return;
    if (get().lastStep === step) return;
    try {
      await AsyncStorage.setItem(LAST_STEP_KEY, String(step));
    } catch {}
    set({ lastStep: step });
  },
}));
