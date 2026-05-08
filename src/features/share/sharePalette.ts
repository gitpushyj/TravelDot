import type { Theme } from "../../theme/theme";

// 공유 카드 배경 팔레트. 사용자가 모달 하단의 색상 칩에서 선택한다.
// 텍스트/뱃지 색은 배경 톤에 맞춰 가독성을 보장하도록 함께 정의한다.
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
      id: "blush",
      bg: "#ffd9dc",
      textPrimary: "#3a1419",
      textSecondary: "#7a3640",
      textMuted: "#b07a82",
      badgeBg: "rgba(255,255,255,0.6)",
      badgeText: "#9a2a3a",
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
    {
      id: "mint",
      bg: "#d4f3e1",
      textPrimary: "#0e2a1c",
      textSecondary: "#3a6a4a",
      textMuted: "#7aa68a",
      badgeBg: "rgba(255,255,255,0.6)",
      badgeText: "#1a7a40",
    },
    {
      id: "lilac",
      bg: "#e8d8ff",
      textPrimary: "#21133a",
      textSecondary: "#4a3a6a",
      textMuted: "#8a7aa0",
      badgeBg: "rgba(255,255,255,0.6)",
      badgeText: "#5a2ea8",
    },
    {
      id: "midnight",
      bg: "#0e0f12",
      textPrimary: "#f5f5f7",
      textSecondary: "#a8aab1",
      textMuted: "#6b6e76",
      badgeBg: "rgba(255,122,61,0.2)",
      badgeText: "#ff9a66",
    },
    {
      id: "forest",
      bg: "#1d3b2a",
      textPrimary: "#e8f5d8",
      textSecondary: "#a8c89a",
      textMuted: "#7a9670",
      badgeBg: "rgba(255,255,255,0.12)",
      badgeText: "#e8f5d8",
    },
  ];
}
