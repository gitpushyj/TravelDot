// 도트 지도의 점점 짙어지는 5단계 히트맵 팔레트.
//
// 디자인 원칙:
//  - 한 팔레트의 5단계는 모두 같은 hue를 공유한다. 단계가 올라갈수록
//    lightness만 단조롭게 바뀌어 "같은 색이 진해진다"는 느낌이 분명해진다.
//  - light 모드는 밝은 배경 위에서 잘 보이도록 단계가 올라갈수록 어두워지고,
//    dark 모드는 어두운 배경 위에서 잘 보이도록 단계가 올라갈수록 밝아진다.
//  - level 0(미방문 도트)은 모든 팔레트가 동일한 bg-matching 회색을 공유한다.
//    지도 대부분의 도트가 level 0이라 팔레트와 무관하게 안정적으로 보여야
//    선택된 팔레트의 1~4단계가 더 잘 드러난다.

export type HeatmapPalette = readonly [string, string, string, string, string];

export type MapPalette = {
  id: string;
  // i18n key 후보. UI는 라벨을 직접 그릴 수도 있으므로 fallback 라벨만 둔다.
  labelKo: string;
  labelEn: string;
  // 스와치 미리보기에 쓰는 대표색 (level 3 — 충분히 진하면서 hue가 분명한 단계).
  swatch: string;
  light: HeatmapPalette;
  dark: HeatmapPalette;
};

// level 0 (방문 없음) 톤 — 모든 팔레트가 공유한다. 베이스 배경에 자연스럽게
// 녹는 톤을 쓰기 위해 LIGHT_THEME.homeBg / DARK_THEME.cardBg에서 따왔다.
const L0_LIGHT = "#d8d6ca";
const L0_DARK = "#2e3038";

// HSL → hex 변환. 모듈 로드 시 SPECS.length × 8 번만 호출되므로 부담 없다.
function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) =>
    lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// Light 모드 1~4단계: lightness 70 → 50 → 33 → 20 (단조 감소).
// satScale은 mono 팔레트(채도 0)를 만들기 위해 곱셈으로 적용.
function genLight(hue: number, satScale: number): HeatmapPalette {
  return [
    L0_LIGHT,
    hslToHex(hue, 42 * satScale, 70),
    hslToHex(hue, 55 * satScale, 50),
    hslToHex(hue, 62 * satScale, 33),
    hslToHex(hue, 65 * satScale, 20),
  ];
}

// Dark 모드 1~4단계: lightness 27 → 42 → 58 → 72 (단조 증가).
function genDark(hue: number, satScale: number): HeatmapPalette {
  return [
    L0_DARK,
    hslToHex(hue, 48 * satScale, 27),
    hslToHex(hue, 58 * satScale, 42),
    hslToHex(hue, 65 * satScale, 58),
    hslToHex(hue, 62 * satScale, 72),
  ];
}

type PaletteSpec = {
  id: string;
  hue: number;
  // 채도 비율 (1 = 표준, 0 = 무채색). mono 팔레트만 0을 쓴다.
  satScale?: number;
  labelKo: string;
  labelEn: string;
};

const SPECS: readonly PaletteSpec[] = [
  { id: "green", hue: 130, labelKo: "초록", labelEn: "Green" },
  { id: "blue", hue: 215, labelKo: "파랑", labelEn: "Blue" },
  { id: "teal", hue: 178, labelKo: "청록", labelEn: "Teal" },
  { id: "purple", hue: 272, labelKo: "보라", labelEn: "Purple" },
  { id: "pink", hue: 330, labelKo: "분홍", labelEn: "Pink" },
  { id: "red", hue: 358, labelKo: "빨강", labelEn: "Red" },
  { id: "orange", hue: 24, labelKo: "주황", labelEn: "Orange" },
  { id: "yellow", hue: 48, labelKo: "노랑", labelEn: "Yellow" },
  { id: "indigo", hue: 245, labelKo: "남색", labelEn: "Indigo" },
  { id: "mono", hue: 0, satScale: 0, labelKo: "모노톤", labelEn: "Mono" },
];

export const MAP_PALETTES: readonly MapPalette[] = SPECS.map((spec) => {
  const satScale = spec.satScale ?? 1;
  const light = genLight(spec.hue, satScale);
  const dark = genDark(spec.hue, satScale);
  return {
    id: spec.id,
    labelKo: spec.labelKo,
    labelEn: spec.labelEn,
    swatch: light[3],
    light,
    dark,
  };
});

export const DEFAULT_MAP_PALETTE_ID = "green";

export function findMapPalette(id: string | undefined | null): MapPalette {
  return (
    MAP_PALETTES.find((p) => p.id === id) ??
    MAP_PALETTES.find((p) => p.id === DEFAULT_MAP_PALETTE_ID)!
  );
}
