// 방문 일수를 5단계 잔디 색으로 매핑한다. 본국은 일수와 무관하게 최고 단계 색.
const PALETTE = [
  "#e8e7df", // 0일 — 미방문 (밝은 회색)
  "#cfe9c8", // 1~2일
  "#9bd093", // 3~6일
  "#5fb360", // 7~13일
  "#2f8a3e", // 14일+
];

export const HEATMAP_PALETTE = PALETTE;

// 본국은 항상 가장 진한 녹색으로 표시한다.
export const HOME_COLOR = PALETTE[4];

// 다크 테마용 배경 (Onboarding/AddTrip에서 계속 사용).
export const BG_COLOR = "#0b1220";

// 라이트 테마(홈 화면) 배경.
export const HOME_BG = "#fbf8f3";
export const CARD_BG = "#ffffff";
export const CARD_BORDER = "#ecebe4";
export const TEXT_PRIMARY = "#1a1a1a";
export const TEXT_SECONDARY = "#8a8779";
export const TEXT_MUTED = "#b8b5aa";
export const ACCENT = "#ff6b35";
export const ACCENT_SOFT_BG = "#ffe5d3";
export const ACCENT_SOFT_TEXT = "#d96a3a";
export const TAB_ROW_BG = "#f3efe6";

export function colorForVisit(opts: {
  count: number;
  isHomeCountry: boolean;
}): string {
  if (opts.isHomeCountry) return HOME_COLOR;
  const c = opts.count | 0;
  if (c <= 0) return PALETTE[0];
  if (c <= 2) return PALETTE[1];
  if (c <= 6) return PALETTE[2];
  if (c <= 13) return PALETTE[3];
  return PALETTE[4];
}
