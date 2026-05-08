import type { Theme } from "../../theme/theme";

// 공유 카드 배경 팔레트. 사용자가 모달 하단의 색상 칩에서 선택한다.
// 텍스트/뱃지 색은 배경 톤에 맞춰 가독성을 보장하도록 함께 정의한다.
// 지도 도트(녹색 계열 heatmap)와 텍스트가 모두 잘 보이는 색만 모았다.
export type SharePalette = {
  id: string;
  bg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  badgeBg: string;
  badgeText: string;
};

export function buildPalettes(theme: Theme): SharePalette[] {
  return [
    {
      id: "theme",
      bg: theme.homeBg,
      textPrimary: theme.textPrimary,
      textSecondary: theme.textSecondary,
      textMuted: theme.textMuted,
      badgeBg: theme.accentSoftBg,
      badgeText: theme.accentSoftText,
    },
    {
      id: "black",
      bg: "#000000",
      textPrimary: "#ffffff",
      textSecondary: "#b0b2ba",
      textMuted: "#6b6e76",
      badgeBg: "rgba(255,122,61,0.22)",
      badgeText: "#ff9a66",
    },
    {
      id: "navy",
      bg: "#0a1a2f",
      textPrimary: "#f5f5f7",
      textSecondary: "#a0b0c8",
      textMuted: "#6a7a90",
      badgeBg: "rgba(255,122,61,0.22)",
      badgeText: "#ff9a66",
    },
    {
      id: "white",
      bg: "#ffffff",
      textPrimary: "#1a1a1a",
      textSecondary: "#5f5e57",
      textMuted: "#a8a69b",
      badgeBg: "#ffe5d3",
      badgeText: "#d96a3a",
    },
    {
      id: "cream",
      bg: "#f5e9d3",
      textPrimary: "#3a2e1c",
      textSecondary: "#6f5f3f",
      textMuted: "#a89673",
      badgeBg: "rgba(217,106,58,0.2)",
      badgeText: "#a8451f",
    },
    {
      id: "sky",
      bg: "#d6ebff",
      textPrimary: "#0e2236",
      textSecondary: "#3a5a7a",
      textMuted: "#7a96b0",
      badgeBg: "rgba(255,255,255,0.6)",
      badgeText: "#1d4ed8",
    },
  ];
}
