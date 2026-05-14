import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import { create } from "zustand";

import {
  DEFAULT_MAP_PALETTE_ID,
  findMapPalette,
  HeatmapPalette,
} from "./mapPalettes";
import { DARK_THEME, LIGHT_THEME, Theme, ThemeMode } from "./theme";

const STORAGE_KEY = "visitgrid:themeMode";
const MAP_LOCK_STORAGE_KEY = "visitgrid:mapThemeLock";
const MAP_PALETTE_STORAGE_KEY = "visitgrid:mapPaletteId";

// 도트 지도만 따로 라이트/다크를 고정하는 옵션. "system"이면 앱 테마를 따라간다.
export type MapThemeLock = "system" | "light" | "dark";

type S = {
  mode: ThemeMode;
  systemScheme: ColorSchemeName;
  hydrated: boolean;
  // 지도 외형 (유료 기능)
  mapThemeLock: MapThemeLock;
  mapPaletteId: string;
  hydrate: () => Promise<void>;
  setMode: (m: ThemeMode) => Promise<void>;
  setSystemScheme: (s: ColorSchemeName) => void;
  setMapThemeLock: (lock: MapThemeLock) => Promise<void>;
  setMapPaletteId: (id: string) => Promise<void>;
};

export const useThemeStore = create<S>((set) => ({
  mode: "system",
  systemScheme: Appearance.getColorScheme(),
  hydrated: false,
  mapThemeLock: "system",
  mapPaletteId: DEFAULT_MAP_PALETTE_ID,
  hydrate: async () => {
    try {
      const [rawMode, rawLock, rawPalette] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(MAP_LOCK_STORAGE_KEY),
        AsyncStorage.getItem(MAP_PALETTE_STORAGE_KEY),
      ]);
      const mode: ThemeMode =
        rawMode === "light" || rawMode === "dark" || rawMode === "system"
          ? rawMode
          : "system";
      const mapThemeLock: MapThemeLock =
        rawLock === "light" || rawLock === "dark" || rawLock === "system"
          ? rawLock
          : "system";
      const mapPaletteId = rawPalette ?? DEFAULT_MAP_PALETTE_ID;
      set({ mode, mapThemeLock, mapPaletteId, hydrated: true });
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
  setMapThemeLock: async (mapThemeLock) => {
    set({ mapThemeLock });
    try {
      await AsyncStorage.setItem(MAP_LOCK_STORAGE_KEY, mapThemeLock);
    } catch {}
  },
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

// 도트 지도에만 적용되는 효과 색. 사용자가 지도 테마를 고정했으면 앱 테마와
// 무관하게 해당 색을 쓰고, 팔레트를 골랐으면 그 팔레트의 5단계 gradient를 쓴다.
export type MapTheme = {
  heatmap: HeatmapPalette;
  homeColor: string;
  highlightDot: string;
  // 미리보기 화면에서 지도 뒤 배경을 칠할 때 사용.
  bgColor: string;
  mode: "light" | "dark";
};

export function useMapTheme(): MapTheme {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useThemeStore((s) => s.systemScheme);
  const mapThemeLock = useThemeStore((s) => s.mapThemeLock);
  const mapPaletteId = useThemeStore((s) => s.mapPaletteId);

  const appEffective = mode === "system" ? systemScheme ?? "light" : mode;
  const effective: "light" | "dark" =
    mapThemeLock === "system"
      ? appEffective === "dark"
        ? "dark"
        : "light"
      : mapThemeLock;

  const base = effective === "dark" ? DARK_THEME : LIGHT_THEME;
  const palette = findMapPalette(mapPaletteId);
  return {
    heatmap: effective === "dark" ? palette.dark : palette.light,
    homeColor: base.homeColor,
    highlightDot: base.highlightDot,
    bgColor: base.homeBg,
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
