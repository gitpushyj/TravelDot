// 각 국가를 한눈에 떠올릴 수 있는 상징색. 대부분 국기에서 가장 두드러진
// 색을 골랐고, 듀얼톤(예: KR 빨강+파랑)은 dot에 보조색을 둔다.
// 매핑이 없는 국가는 null을 돌려 호출 측에서 테마 accent로 폴백한다.

export type CountryColor = {
  bg: string; // 카드/배경에 쓰는 진한 톤
  dot: string; // bg 위에 얹는 점/포인트 색 (보색 또는 밝은 톤)
};

const WHITE_DOT = "rgba(255,255,255,0.88)";

// ISO 3166-1 alpha-2 → 색
const COUNTRY_COLORS: Record<string, CountryColor> = {
  // 동아시아
  KR: { bg: "#cd2e3a", dot: "#0047a0" }, // 태극기 빨강+파랑
  JP: { bg: "#bc002d", dot: WHITE_DOT },
  CN: { bg: "#de2910", dot: "#ffde00" },
  TW: { bg: "#fe0000", dot: "#000095" },
  HK: { bg: "#de2910", dot: WHITE_DOT },
  MO: { bg: "#00785a", dot: WHITE_DOT },
  MN: { bg: "#c4272f", dot: "#f9cf02" },

  // 동남아시아
  TH: { bg: "#2d2a4a", dot: "#a51931" },
  VN: { bg: "#da251d", dot: "#ffff00" },
  SG: { bg: "#ed2939", dot: WHITE_DOT },
  MY: { bg: "#010066", dot: "#ffcc00" },
  ID: { bg: "#ce1126", dot: WHITE_DOT },
  PH: { bg: "#0038a8", dot: "#fcd116" },
  KH: { bg: "#032ea1", dot: "#e00025" },
  LA: { bg: "#002868", dot: "#ce1126" },
  MM: { bg: "#fecb00", dot: "#34b233" },
  BN: { bg: "#f7e017", dot: "#cf1126" },
  TL: { bg: "#dc241f", dot: "#ffc726" },

  // 남아시아
  IN: { bg: "#ff9933", dot: "#138808" },
  NP: { bg: "#dc143c", dot: "#003893" },
  LK: { bg: "#8d153a", dot: "#ffbe29" },
  BD: { bg: "#006a4e", dot: "#f42a41" },
  PK: { bg: "#01411c", dot: WHITE_DOT },
  BT: { bg: "#ffcc33", dot: "#ff4e12" },
  MV: { bg: "#d21034", dot: "#007e3a" },

  // 중동
  AE: { bg: "#00732f", dot: "#ff0000" },
  SA: { bg: "#006c35", dot: WHITE_DOT },
  QA: { bg: "#8a1538", dot: WHITE_DOT },
  KW: { bg: "#007a3d", dot: WHITE_DOT },
  BH: { bg: "#ce1126", dot: WHITE_DOT },
  OM: { bg: "#df4e34", dot: WHITE_DOT },
  IL: { bg: "#0038b8", dot: WHITE_DOT },
  TR: { bg: "#e30a17", dot: WHITE_DOT },
  IR: { bg: "#239f40", dot: "#da0000" },
  IQ: { bg: "#ce1126", dot: WHITE_DOT },
  JO: { bg: "#007a3d", dot: "#ce1126" },
  LB: { bg: "#ed1c24", dot: "#00a651" },

  // 유럽
  GB: { bg: "#012169", dot: "#c8102e" },
  IE: { bg: "#009a44", dot: "#ff883e" },
  FR: { bg: "#0055a4", dot: "#ef4135" },
  DE: { bg: "#1a1a1a", dot: "#ffce00" },
  IT: { bg: "#009246", dot: "#ce2b37" },
  ES: { bg: "#aa151b", dot: "#f1bf00" },
  PT: { bg: "#006600", dot: "#ff0000" },
  NL: { bg: "#ae1c28", dot: "#ff7f00" },
  BE: { bg: "#000000", dot: "#fdda24" },
  LU: { bg: "#ed2939", dot: "#00a3e0" },
  CH: { bg: "#da291c", dot: WHITE_DOT },
  AT: { bg: "#c8102e", dot: WHITE_DOT },
  GR: { bg: "#0d5eaf", dot: WHITE_DOT },
  CY: { bg: "#d57800", dot: "#4e5b31" },
  MT: { bg: "#cf142b", dot: WHITE_DOT },
  DK: { bg: "#c8102e", dot: WHITE_DOT },
  SE: { bg: "#006aa7", dot: "#fecc00" },
  NO: { bg: "#ba0c2f", dot: "#00205b" },
  FI: { bg: "#003580", dot: WHITE_DOT },
  IS: { bg: "#02529c", dot: "#dc1e35" },
  PL: { bg: "#dc143c", dot: WHITE_DOT },
  CZ: { bg: "#11457e", dot: "#d7141a" },
  SK: { bg: "#0b4ea2", dot: "#ee1c25" },
  HU: { bg: "#cd2a3e", dot: "#436f4d" },
  RO: { bg: "#002b7f", dot: "#fcd116" },
  BG: { bg: "#00966e", dot: "#d62612" },
  RS: { bg: "#c6363c", dot: "#0c4076" },
  HR: { bg: "#171796", dot: "#ff0000" },
  SI: { bg: "#005ce5", dot: "#ed1c24" },
  BA: { bg: "#002395", dot: "#fecb00" },
  AL: { bg: "#e41e20", dot: "#1a1a1a" },
  MK: { bg: "#d20000", dot: "#f8e92e" },
  ME: { bg: "#c40308", dot: "#d4af37" },
  EE: { bg: "#0072ce", dot: "#1a1a1a" },
  LV: { bg: "#9e3039", dot: WHITE_DOT },
  LT: { bg: "#fdb913", dot: "#006a44" },
  RU: { bg: "#0033a0", dot: "#d52b1e" },
  UA: { bg: "#0057b7", dot: "#ffd700" },
  BY: { bg: "#c8313e", dot: "#4aa657" },

  // 아프리카
  EG: { bg: "#ce1126", dot: "#fdd700" },
  MA: { bg: "#c1272d", dot: "#006233" },
  TN: { bg: "#e70013", dot: WHITE_DOT },
  DZ: { bg: "#006233", dot: "#d21034" },
  ZA: { bg: "#007749", dot: "#ffb612" },
  KE: { bg: "#bb0000", dot: "#006600" },
  ET: { bg: "#078930", dot: "#fcdd09" },
  NG: { bg: "#008753", dot: WHITE_DOT },
  GH: { bg: "#006b3f", dot: "#fcd116" },
  TZ: { bg: "#1eb53a", dot: "#fcd116" },
  UG: { bg: "#000000", dot: "#fcdc04" },
  SN: { bg: "#00853f", dot: "#fdef42" },
  CI: { bg: "#ff8200", dot: "#009e60" },
  CM: { bg: "#007a5e", dot: "#ce1126" },
  RW: { bg: "#00a1de", dot: "#fad201" },
  ZW: { bg: "#006400", dot: "#fcd116" },

  // 북미
  US: { bg: "#3c3b6e", dot: "#b22234" },
  CA: { bg: "#ff0000", dot: WHITE_DOT },
  MX: { bg: "#006847", dot: "#ce1126" },
  CU: { bg: "#002a8f", dot: "#cf142b" },
  JM: { bg: "#009b3a", dot: "#fed100" },
  DO: { bg: "#002d62", dot: "#ce1126" },
  PA: { bg: "#005293", dot: "#d41a35" },
  CR: { bg: "#002b7f", dot: "#ce1126" },
  GT: { bg: "#4997d0", dot: WHITE_DOT },

  // 남미
  BR: { bg: "#009c3b", dot: "#ffdf00" },
  AR: { bg: "#75aadb", dot: "#fcbf49" },
  CL: { bg: "#0039a6", dot: "#d52b1e" },
  PE: { bg: "#d91023", dot: WHITE_DOT },
  CO: { bg: "#fcd116", dot: "#003893" },
  VE: { bg: "#fcd116", dot: "#cf142b" },
  EC: { bg: "#ffd100", dot: "#0072ce" },
  BO: { bg: "#d52b1e", dot: "#007934" },
  UY: { bg: "#0038a8", dot: "#fcd116" },
  PY: { bg: "#d52b1e", dot: "#0038a8" },

  // 오세아니아
  AU: { bg: "#00008b", dot: "#e4002b" },
  NZ: { bg: "#00247d", dot: "#cc142b" },
  FJ: { bg: "#68bfe5", dot: "#cf142b" },
  PG: { bg: "#000000", dot: "#ce1126" },
};

const FALLBACK: CountryColor = {
  bg: "#ff6b35",
  dot: WHITE_DOT,
};

export function colorForCountry(code: string | null | undefined): CountryColor {
  if (!code) return FALLBACK;
  return COUNTRY_COLORS[code.toUpperCase()] ?? FALLBACK;
}

// 매핑 존재 여부를 알고 싶을 때 사용. 폴백을 쓸지 결정할 때 유용.
export function hasCountryColor(code: string | null | undefined): boolean {
  if (!code) return false;
  return code.toUpperCase() in COUNTRY_COLORS;
}

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 3 && cleaned.length !== 6) return null;
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function relativeLuminance(hex: string): number {
  const rgb = parseHexRgb(hex);
  if (!rgb) return 1;
  const toLin = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(rgb.r) + 0.7152 * toLin(rgb.g) + 0.0722 * toLin(rgb.b);
}

// 배경 hex 색에 대비되는 텍스트 색을 반환. WCAG 상대 휘도 기준으로 흰색/검정 중 선택.
export function readableTextOn(bgHex: string): string {
  return relativeLuminance(bgHex) > 0.5 ? "#1a1a1a" : "#ffffff";
}

// 국기 박스처럼 작은 영역의 배경에 쓸 톤. 상징색이 진할수록 알파를 낮춰
// 살짝 연하게 보이도록 한다. 매핑이 없는 국가는 null을 돌려 호출 측에서
// 테마 기본값(theme.flagBoxBg)으로 폴백한다.
export function flagBoxBgFor(code: string | null | undefined): string | null {
  if (!hasCountryColor(code)) return null;
  const { bg } = colorForCountry(code);
  const rgb = parseHexRgb(bg);
  if (!rgb) return null;
  const lum = relativeLuminance(bg);
  // 진한 색일수록 더 큰 알파 감쇠. 밝은 파스텔/노랑 계열은 거의 그대로 둔다.
  let alpha: number;
  if (lum < 0.12) alpha = 0.22;
  else if (lum < 0.3) alpha = 0.32;
  else if (lum < 0.55) alpha = 0.5;
  else alpha = 0.7;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
