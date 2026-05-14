import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { create } from "zustand";

import { useSubscriptionStore } from "../features/subscription/subscriptionStore";

import {
  DEFAULT_MAP_PALETTE_ID,
  findMapPalette,
  HeatmapPalette,
} from "./mapPalettes";
import { DARK_THEME, LIGHT_THEME, Theme, ThemeMode } from "./theme";

const STORAGE_KEY = "visitgrid:themeMode";
const MAP_PALETTE_STORAGE_KEY = "visitgrid:mapPaletteId";

type S = {
  mode: ThemeMode;
  systemScheme: ColorSchemeName;
  hydrated: boolean;
  // 지도 도트 팔레트 (유료 기능). 라이트/다크 변종은 앱 테마를 그대로 따라간다.
  mapPaletteId: string;
  hydrate: () => Promise<void>;
  setMode: (m: ThemeMode) => Promise<void>;
  setSystemScheme: (s: ColorSchemeName) => void;
  setMapPaletteId: (id: string) => Promise<void>;
};

export const useThemeStore = create<S>((set) => ({
  mode: "system",
  systemScheme: Appearance.getColorScheme(),
  hydrated: false,
  mapPaletteId: DEFAULT_MAP_PALETTE_ID,
  hydrate: async () => {
    try {
      const [rawMode, rawPalette] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(MAP_PALETTE_STORAGE_KEY),
      ]);
      const mode: ThemeMode =
        rawMode === "light" || rawMode === "dark" || rawMode === "system"
          ? rawMode
          : "system";
      const mapPaletteId = rawPalette ?? DEFAULT_MAP_PALETTE_ID;
      set({ mode, mapPaletteId, hydrated: true });
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
  setMapPaletteId: async (mapPaletteId) => {
    set({ mapPaletteId });
    try {
      await AsyncStorage.setItem(MAP_PALETTE_STORAGE_KEY, mapPaletteId);
    } catch {}
  },
}));

export function useTheme(): Theme {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useThemeStore((s) => s.systemScheme);
  const effective = mode === "system" ? systemScheme ?? "light" : mode;
  return effective === "dark" ? DARK_THEME : LIGHT_THEME;
}

// 도트 지도에만 적용되는 효과 색. light/dark 변종은 앱 테마를 그대로 따라가고,
// 팔레트(heatmap)만 사용자가 고른 값을 쓴다.
export type MapTheme = {
  heatmap: HeatmapPalette;
  homeColor: string;
  highlightDot: string;
  mode: "light" | "dark";
};

export function useMapTheme(): MapTheme {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useThemeStore((s) => s.systemScheme);
  const storedPaletteId = useThemeStore((s) => s.mapPaletteId);
  // 도트 팔레트는 유료 전용. 미가입/free로 돌아가면 저장값(이전 선택)을 무시하고
  // 항상 기본 팔레트를 적용한다. 저장값 자체는 유지해, 재가입 시 자동 복원된다.
  const tier = useSubscriptionStore((s) => s.tier);
  const isSubscribed = tier != null && tier !== "free";

  const effectivePaletteId = isSubscribed
    ? storedPaletteId
    : DEFAULT_MAP_PALETTE_ID;

  const effective: "light" | "dark" =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const base = effective === "dark" ? DARK_THEME : LIGHT_THEME;
  const palette = findMapPalette(effectivePaletteId);
  return {
    heatmap: effective === "dark" ? palette.dark : palette.light,
    homeColor: base.homeColor,
    highlightDot: base.highlightDot,
    mode: effective,
  };
}

// 도트 지도에서 방문 횟수 → 색을 결정. theme.ts의 colorForVisitWith와 동일한
// 로직이지만 입력이 MapTheme이라 사용자가 고른 팔레트가 반영된다.
export function colorForVisitOnMap(
  mapTheme: MapTheme,
  opts: { count: number; isHomeCountry: boolean }
): string {
  if (opts.isHomeCountry) return mapTheme.homeColor;
  const c = opts.count | 0;
  if (c <= 0) return mapTheme.heatmap[0];
  if (c <= 2) return mapTheme.heatmap[1];
  if (c <= 6) return mapTheme.heatmap[2];
  if (c <= 13) return mapTheme.heatmap[3];
  return mapTheme.heatmap[4];
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
