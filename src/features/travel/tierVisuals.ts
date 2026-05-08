// 등급별 아이콘 + 색상/글로우 정의.
// 호칭 카드(BadgeCard)와 i18n 텍스트(Alert/헤더 칩)에서 모두 참조한다.
//
// 색상 단계:
//   entry  (T1~T3): 그레이 — 입문 단계
//   bronze (T4~T6): 브론즈 — 익숙해지는 단계
//   silver (T7~T9): 실버  — 능숙한 단계
//   gold   (T10):   골드  — 상위 1%
//   명예 등급(Master 이상)은 색 + 외곽 글로우 강도로 차등.

import {
  Award,
  Backpack,
  Compass,
  Crown,
  Footprints,
  Globe,
  House,
  Map,
  MapPin,
  Mountain,
  Plane,
  Star,
  Tent,
  Trophy,
  type LucideIcon,
} from "lucide-react-native";

import type { TierId } from "./tierTitles";

export type TierVisual = {
  Icon: LucideIcon;
  /** 메인 색상 — 아이콘 stroke + 외곽 링 + 글로우에 사용 */
  color: string;
  /** 카드 배경 틴트 (rgba). 라이트/다크 양쪽에서 자연스러운 알파 사용. */
  tintBg: string;
  /** 외곽 글로우 강도. 0=없음, 1~3은 명예 등급에서 단계적으로 증가. */
  glow: 0 | 1 | 2 | 3;
  /** Alert/헤더 칩 등 텍스트 컨텍스트용 fallback 이모지. */
  emoji: string;
};

const ENTRY = "#6b7280"; // gray-500
const BRONZE = "#b87333";
const SILVER = "#94a3b8"; // slate-400
const GOLD = "#f59e0b"; // amber-500
const PLATINUM = "#cbd5e1"; // slate-300
const ROYAL = "#a855f7"; // purple-500
const UN_GOLD = "#fbbf24"; // amber-400

export const TIER_VISUALS: Record<TierId, TierVisual> = {
  T0: {
    Icon: MapPin,
    color: ENTRY,
    tintBg: "rgba(107,114,128,0.10)",
    glow: 0,
    emoji: "🧭",
  },
  T1: {
    Icon: House,
    color: ENTRY,
    tintBg: "rgba(107,114,128,0.12)",
    glow: 0,
    emoji: "🏠",
  },
  T2: {
    Icon: Footprints,
    color: ENTRY,
    tintBg: "rgba(107,114,128,0.14)",
    glow: 0,
    emoji: "👣",
  },
  T3: {
    Icon: MapPin,
    color: ENTRY,
    tintBg: "rgba(107,114,128,0.16)",
    glow: 0,
    emoji: "📍",
  },
  T4: {
    Icon: Map,
    color: BRONZE,
    tintBg: "rgba(184,115,51,0.14)",
    glow: 0,
    emoji: "🗺️",
  },
  T5: {
    Icon: Backpack,
    color: BRONZE,
    tintBg: "rgba(184,115,51,0.16)",
    glow: 0,
    emoji: "🎒",
  },
  T6: {
    Icon: Compass,
    color: BRONZE,
    tintBg: "rgba(184,115,51,0.18)",
    glow: 0,
    emoji: "🧭",
  },
  T7: {
    Icon: Mountain,
    color: SILVER,
    tintBg: "rgba(148,163,184,0.16)",
    glow: 0,
    emoji: "🏔️",
  },
  T8: {
    Icon: Tent,
    color: SILVER,
    tintBg: "rgba(148,163,184,0.18)",
    glow: 0,
    emoji: "⛺",
  },
  T9: {
    Icon: Plane,
    color: SILVER,
    tintBg: "rgba(148,163,184,0.20)",
    glow: 0,
    emoji: "✈️",
  },
  T10: {
    Icon: Globe,
    color: GOLD,
    tintBg: "rgba(245,158,11,0.18)",
    glow: 1,
    emoji: "🌍",
  },
  MASTER: {
    Icon: Star,
    color: GOLD,
    tintBg: "rgba(245,158,11,0.22)",
    glow: 2,
    emoji: "⭐️",
  },
  GRANDMASTER: {
    Icon: Trophy,
    color: PLATINUM,
    tintBg: "rgba(203,213,225,0.22)",
    glow: 2,
    emoji: "🏆",
  },
  LEGEND: {
    Icon: Crown,
    color: ROYAL,
    tintBg: "rgba(168,85,247,0.22)",
    glow: 3,
    emoji: "💎",
  },
  UN_MASTER: {
    Icon: Award,
    color: UN_GOLD,
    tintBg: "rgba(251,191,36,0.26)",
    glow: 3,
    emoji: "🌐",
  },
};

/** `tier_T5` 같은 BadgeId에서 TierVisual을 추출. tier 뱃지가 아니면 null. */
export function tierVisualFromBadgeId(id: string): TierVisual | null {
  if (!id.startsWith("tier_")) return null;
  const tierId = id.slice(5) as TierId;
  return TIER_VISUALS[tierId] ?? null;
}
