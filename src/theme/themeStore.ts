import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { create } from "zustand";

import { DARK_THEME, LIGHT_THEME, Theme, ThemeMode } from "./theme";

const STORAGE_KEY = "visitgrid:themeMode";

type S = {
  mode: ThemeMode;
  systemScheme: ColorSchemeName;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (m: ThemeMode) => Promise<void>;
  setSystemScheme: (s: ColorSchemeName) => void;
};

export const useThemeStore = create<S>((set) => ({
  mode: "system",
  systemScheme: Appearance.getColorScheme(),
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const mode: ThemeMode =
        raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
      set({ mode, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
  setMode: async (mode) => {
    set({ mode });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // 영속화 실패해도 메모리 상태는 유지한다.
    }
  },
  setSystemScheme: (systemScheme) => set({ systemScheme }),
}));

export function useTheme(): Theme {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useThemeStore((s) => s.systemScheme);
  const effective = mode === "system" ? systemScheme ?? "light" : mode;
  return effective === "dark" ? DARK_THEME : LIGHT_THEME;
}

// 앱 루트에서 한 번 호출해 OS 다크모드 변경을 store에 동기화한다.
export function useSystemSchemeListener() {
  const setSystemScheme = useThemeStore((s) => s.setSystemScheme);
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, [setSystemScheme]);
}
