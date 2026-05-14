// 도트 지도의 점점 짙어지는 5단계 히트맵 팔레트.
// level 0은 "방문 없음" 톤이라 라이트/다크 베이스 색에 맞춰 고정한다.
// level 1~4는 팔레트마다 고유 hue로 점점 진해진다.

export type HeatmapPalette = readonly [string, string, string, string, string];

export type MapPalette = {
  id: string;
  // i18n key 후보. UI는 라벨을 직접 그릴 수도 있으므로 fallback 라벨만 둔다.
  labelKo: string;
  labelEn: string;
  // 스와치 미리보기에 쓰는 대표색 (보통 level 4 — 가장 진한 색).
  swatch: string;
  light: HeatmapPalette;
  dark: HeatmapPalette;
};

// level 0 (방문 없음) 톤 — 모든 팔레트가 공유한다. 베이스 배경에 자연스럽게
// 녹는 톤을 쓰기 위해 LIGHT_THEME.homeBg / DARK_THEME.cardBg에서 따왔다.
const L0_LIGHT = "#d8d6ca";
const L0_DARK = "#2e3038";

export const MAP_PALETTES: readonly MapPalette[] = [
  {
    id: "green",
    labelKo: "초록",
    labelEn: "Green",
    swatch: "#2d7d34",
    light: [L0_LIGHT, "#92c886", "#5fa252", "#2d7d34", "#155321"],
    dark: [L0_DARK, "#0e4429", "#006d32", "#26a641", "#39d353"],
  },
  {
    id: "blue",
    labelKo: "파랑",
    labelEn: "Blue",
    swatch: "#2c6cb4",
    light: [L0_LIGHT, "#a5c6ea", "#5b96d4", "#2c6cb4", "#103a78"],
    dark: [L0_DARK, "#0c2d56", "#0e4d8c", "#2872cf", "#5ba3f0"],
  },
  {
    id: "teal",
    labelKo: "청록",
    labelEn: "Teal",
    swatch: "#1f7c70",
    light: [L0_LIGHT, "#9adcd0", "#4eb3a2", "#1f7c70", "#0c4a44"],
    dark: [L0_DARK, "#0d3a36", "#106d5f", "#21a08e", "#5cd3c0"],
  },
  {
    id: "purple",
    labelKo: "보라",
    labelEn: "Purple",
    swatch: "#6e3eaa",
    light: [L0_LIGHT, "#c5a4e0", "#9b6dc8", "#6e3eaa", "#3a1e78"],
    dark: [L0_DARK, "#2c1547", "#542283", "#8943c8", "#bd7dee"],
  },
  {
    id: "pink",
    labelKo: "분홍",
    labelEn: "Pink",
    swatch: "#cc5896",
    light: [L0_LIGHT, "#f4b8d4", "#e886b8", "#cc5896", "#8e276e"],
    dark: [L0_DARK, "#421c33", "#7a2e5d", "#bd479a", "#f08bc8"],
  },
  {
    id: "red",
    labelKo: "빨강",
    labelEn: "Red",
    swatch: "#a83838",
    light: [L0_LIGHT, "#e8a4a4", "#d66a6a", "#a83838", "#6e1818"],
    dark: [L0_DARK, "#3a1414", "#7a1d1d", "#bf2a2a", "#ef6b6b"],
  },
  {
    id: "orange",
    labelKo: "주황",
    labelEn: "Orange",
    swatch: "#e0671f",
    light: [L0_LIGHT, "#ffc795", "#ff9a5a", "#e0671f", "#9f3f08"],
    dark: [L0_DARK, "#3a1f00", "#7a3d00", "#c95800", "#ffb86b"],
  },
  {
    id: "yellow",
    labelKo: "노랑",
    labelEn: "Yellow",
    swatch: "#dd9a14",
    light: [L0_LIGHT, "#ffe082", "#ffc548", "#dd9a14", "#9c6b04"],
    dark: [L0_DARK, "#3a2e00", "#7a5b00", "#c79a00", "#ffd84d"],
  },
  {
    id: "indigo",
    labelKo: "남색",
    labelEn: "Indigo",
    swatch: "#3f4aaa",
    light: [L0_LIGHT, "#a4abe0", "#6f78c8", "#3f4aaa", "#1f2778"],
    dark: [L0_DARK, "#1c1f47", "#373d8c", "#6068cc", "#9ba2ef"],
  },
  {
    id: "mono",
    labelKo: "모노톤",
    labelEn: "Mono",
    swatch: "#454238",
    light: [L0_LIGHT, "#a6a399", "#737065", "#454238", "#1f1d18"],
    dark: [L0_DARK, "#3e4148", "#5c5f68", "#8a8d97", "#c4c6cd"],
  },
];

export const DEFAULT_MAP_PALETTE_ID = "green";

export function findMapPalette(id: string | undefined | null): MapPalette {
  return (
    MAP_PALETTES.find((p) => p.id === id) ??
    MAP_PALETTES.find((p) => p.id === DEFAULT_MAP_PALETTE_ID)!
  );
}
