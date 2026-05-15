// 라이트/다크 테마의 모든 색상 토큰을 한 곳에서 정의한다.
// useTheme() 훅이 현재 활성 테마를 돌려주고, 컴포넌트는 토큰만 사용한다.

export type ThemeMode = "light" | "dark" | "system";

export type Theme = {
  // 화면/카드/구분선
  homeBg: string;
  cardBg: string;
  cardBorder: string;
  // 텍스트
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // 강조색 (오렌지 톤)
  accent: string;
  accentOn: string; // accent 위에 얹는 글씨/아이콘 색
  accentSoftBg: string;
  accentSoftText: string;
  // accent와 함께 ping-pong 보간되는 보조 톤. Premium CTA의 시선 끄는 shimmer에 사용.
  ctaShimmer: string;
  // 위험/한도 톤 (AI 채팅 한도 초과 배너 등)
  dangerBg: string;
  dangerOn: string;
  // 탭/필 배경
  tabRowBg: string;
  // 잔디(히트맵) 5단계 + 본국 색
  heatmap: [string, string, string, string, string];
  homeColor: string;
  // 여행 추가/온보딩 화면이 쓰는 진한 다크 배경 (라이트 테마에서도 동일하게 다크 유지)
  legacyDarkBg: string;
  // 카드 위에 얹는 작은 박스 (국기 배경 등)
  flagBoxBg: string;
  // 행 눌렀을 때 하이라이트
  rowPressedBg: string;
  // 모달 백드롭
  backdrop: string;
  // 연도 모달용
  sheetBg: string;
  handleColor: string;
  selectedRowBg: string;
  radioBorder: string;
  radioCheckColor: string;
  // 옵션 버튼 (지도 다중 후보 등)
  optionBtnBg: string;
  optionBtnPressedBg: string;
  optionBtnBorder: string;
  // 지도 도트 강조 (검색/선택)
  highlightDot: string;
  // 비행 경로 점선 (전체 흐린 색 + 지나온 진한 색).
  // 라이트 테마에서는 어두운 톤, 다크 테마에서는 흰 톤.
  flightPathFaint: string;
  flightPathBright: string;
  // 상태 표시줄 스타일 ("light" → 흰 글씨)
  statusBar: "light" | "dark";
};

export const LIGHT_THEME: Theme = {
  homeBg: "#fbf8f3",
  cardBg: "#ffffff",
  cardBorder: "#ecebe4",
  textPrimary: "#1a1a1a",
  textSecondary: "#8a8779",
  textMuted: "#b8b5aa",
  accent: "#ff6b35",
  accentOn: "#ffffff",
  accentSoftBg: "#ffe5d3",
  accentSoftText: "#d96a3a",
  ctaShimmer: "#ffb066",
  dangerBg: "#fee2e2",
  dangerOn: "#991b1b",
  tabRowBg: "#f3efe6",
  heatmap: ["#d8d6ca", "#92d39d", "#49c55e", "#2d9f40", "#20792f"],
  homeColor: "#1d4ed8",
  legacyDarkBg: "#0b1220",
  flagBoxBg: "#fce6e0",
  rowPressedBg: "#f7f4ec",
  backdrop: "rgba(0,0,0,0.35)",
  sheetBg: "#ffffff",
  handleColor: "#d8d4c7",
  selectedRowBg: "#fff4ec",
  radioBorder: "#dad6c8",
  radioCheckColor: "#ffffff",
  optionBtnBg: "#ffffff",
  optionBtnPressedBg: "#f3efe6",
  optionBtnBorder: "#ecebe4",
  highlightDot: "#ffd75e",
  flightPathFaint: "rgba(0,0,0,0.5)",
  flightPathBright: "#1a1a1a",
  statusBar: "dark",
};

// 다크 팔레트는 GitHub 잔디 톤 + 차분한 카본 그레이로 구성한다.
export const DARK_THEME: Theme = {
  homeBg: "#0e0f12",
  cardBg: "#17181c",
  cardBorder: "rgba(255,255,255,0.06)",
  textPrimary: "#f5f5f7",
  textSecondary: "#a8aab1",
  textMuted: "#6b6e76",
  accent: "#ff7a3d",
  accentOn: "#ffffff",
  accentSoftBg: "rgba(255,122,61,0.16)",
  accentSoftText: "#ff9a66",
  ctaShimmer: "#ffc28a",
  dangerBg: "rgba(220,38,38,0.18)",
  dangerOn: "#fecaca",
  tabRowBg: "rgba(255,255,255,0.06)",
  heatmap: ["#2e3038", "#2b6e36", "#34ad48", "#4ed063", "#78d988"],
  homeColor: "#3b82f6",
  legacyDarkBg: "#0b1220",
  flagBoxBg: "rgba(255,255,255,0.08)",
  rowPressedBg: "rgba(255,255,255,0.04)",
  backdrop: "rgba(0,0,0,0.55)",
  sheetBg: "#17181c",
  handleColor: "#3a3c44",
  selectedRowBg: "rgba(255,122,61,0.16)",
  radioBorder: "#3a3c44",
  radioCheckColor: "#0e0f12",
  optionBtnBg: "#22242a",
  optionBtnPressedBg: "#2c2e36",
  optionBtnBorder: "rgba(255,255,255,0.08)",
  highlightDot: "#ffd75e",
  flightPathFaint: "rgba(255,255,255,0.32)",
  flightPathBright: "#ffffff",
  statusBar: "light",
};

export function colorForVisitWith(
  theme: Theme,
  opts: { count: number; isHomeCountry: boolean }
): string {
  if (opts.isHomeCountry) return theme.homeColor;
  const c = opts.count | 0;
  if (c <= 0) return theme.heatmap[0];
  if (c <= 2) return theme.heatmap[1];
  if (c <= 6) return theme.heatmap[2];
  if (c <= 13) return theme.heatmap[3];
  return theme.heatmap[4];
}
