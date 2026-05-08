// 모든 호칭 카테고리(등급/일수/대륙/국가/해외)의 메달 시각을 한 곳에서 정의.
//
// 단계(stage) 시스템:
//   entry  → 입문 (그레이)
//   bronze → 익숙해지는 단계
//   silver → 능숙한 단계
//   gold   → 정점 (약한 글로우)
//   p1~p4  → 명예 (글로우 강화)
//
// 카테고리별로 단계 + 콘텐츠(아이콘 or 이모지)를 부여한다.
//   tier:      lucide 아이콘 + stage (TierId별)
//   days:      lucide 아이콘 + stage (threshold별)
//   continent: 대륙 이모지 + stage (initiate/wanderer/conqueror)
//   country:   국기 이모지 + stage (30/100/365일)
//   foreign:   lucide 아이콘 + stage (threshold별)

import {
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Camera,
  Hourglass,
  ImagePlus,
  Images,
  Infinity as InfinityIcon,
  Sparkles,
  Sunrise,
  type LucideIcon,
} from "lucide-react-native";

import { TIER_VISUALS } from "../travel/tierVisuals";
import type { BadgeDefinition } from "./badges";

export type BadgeStage =
  | "entry"
  | "bronze"
  | "silver"
  | "gold"
  | "p1"
  | "p2"
  | "p3"
  | "p4";

export type StageVisual = {
  /** 메인 색 — 아이콘 stroke + 외곽 링 + 글로우에 사용 */
  color: string;
  /** 카드 배경 틴트 (rgba) */
  tintBg: string;
  /** 외곽 글로우 강도. 0=없음 */
  glow: 0 | 1 | 2 | 3;
};

export const STAGE_VISUALS: Record<BadgeStage, StageVisual> = {
  entry: { color: "#6b7280", tintBg: "rgba(107,114,128,0.14)", glow: 0 },
  bronze: { color: "#b87333", tintBg: "rgba(184,115,51,0.16)", glow: 0 },
  silver: { color: "#94a3b8", tintBg: "rgba(148,163,184,0.18)", glow: 0 },
  gold: { color: "#f59e0b", tintBg: "rgba(245,158,11,0.20)", glow: 1 },
  p1: { color: "#f59e0b", tintBg: "rgba(245,158,11,0.24)", glow: 2 },
  p2: { color: "#cbd5e1", tintBg: "rgba(203,213,225,0.22)", glow: 2 },
  p3: { color: "#a855f7", tintBg: "rgba(168,85,247,0.22)", glow: 3 },
  p4: { color: "#fbbf24", tintBg: "rgba(251,191,36,0.26)", glow: 3 },
};

export type MedalContent =
  | { kind: "icon"; Icon: LucideIcon }
  | { kind: "emoji"; emoji: string };

export type MedalConfig = {
  stage: BadgeStage;
  content: MedalContent;
};

// === days ===
// 7d/30d/100d/365d/730d/1000d → entry/bronze/silver/gold/p1/p3
const DAYS_MEDAL: Record<number, MedalConfig> = {
  7: { stage: "entry", content: { kind: "icon", Icon: CalendarDays } },
  30: { stage: "bronze", content: { kind: "icon", Icon: CalendarRange } },
  100: { stage: "silver", content: { kind: "icon", Icon: CalendarCheck } },
  365: { stage: "gold", content: { kind: "icon", Icon: Hourglass } },
  730: { stage: "p1", content: { kind: "icon", Icon: Sunrise } },
  1000: { stage: "p3", content: { kind: "icon", Icon: InfinityIcon } },
};

// === foreign ===
// 100/500/1000/3000 → bronze/silver/gold/p3
const FOREIGN_MEDAL: Record<number, MedalConfig> = {
  100: { stage: "bronze", content: { kind: "icon", Icon: Camera } },
  500: { stage: "silver", content: { kind: "icon", Icon: Images } },
  1000: { stage: "gold", content: { kind: "icon", Icon: ImagePlus } },
  3000: { stage: "p3", content: { kind: "icon", Icon: Sparkles } },
};

// === continent ===
// initiate/wanderer/conqueror → bronze/silver/gold (대륙 이모지 유지)
function continentStage(idSuffix: string): BadgeStage {
  if (idSuffix.endsWith("_initiate")) return "bronze";
  if (idSuffix.endsWith("_wanderer")) return "silver";
  return "gold"; // conqueror or AN_pioneer
}

// === country ===
// 30/100/365 → bronze/silver/gold (국기 이모지 유지)
function countryStage(threshold: number): BadgeStage {
  if (threshold >= 365) return "gold";
  if (threshold >= 100) return "silver";
  return "bronze";
}

/**
 * 임의의 뱃지에서 메달 표시 설정을 도출.
 * 지원하지 않는 카테고리/ID 형식은 null 반환 → 호출부는 fallback 이모지 텍스트로 처리.
 */
export function medalConfigForBadge(badge: BadgeDefinition): MedalConfig | null {
  const id = badge.id;

  if (id.startsWith("tier_")) {
    const tierId = id.slice(5) as keyof typeof TIER_VISUALS;
    const tv = TIER_VISUALS[tierId];
    if (!tv) return null;
    return { stage: tv.stage, content: { kind: "icon", Icon: tv.Icon } };
  }

  if (id.startsWith("days_")) {
    const n = Number(id.slice(5));
    return DAYS_MEDAL[n] ?? null;
  }

  if (id.startsWith("foreign_")) {
    const n = Number(id.slice(8));
    return FOREIGN_MEDAL[n] ?? null;
  }

  if (id.startsWith("continent_")) {
    return {
      stage: continentStage(id),
      content: { kind: "emoji", emoji: badge.emoji },
    };
  }

  if (id.startsWith("country_")) {
    const m = id.match(/_d(\d+)$/);
    const threshold = m ? Number(m[1]) : 0;
    return {
      stage: countryStage(threshold),
      content: { kind: "emoji", emoji: badge.emoji },
    };
  }

  return null;
}
