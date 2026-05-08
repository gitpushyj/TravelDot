// 등급별 아이콘 + stage 매핑.
// 색/글로우 같은 시각 토큰은 `badgeVisuals.ts`의 STAGE_VISUALS 한 곳에서 관리.
// 이 파일은 "어떤 등급이 어떤 lucide 아이콘과 어떤 단계를 쓰는가"만 정의한다.

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

import type { BadgeStage } from "../badges/badgeVisuals";
import type { TierId } from "./tierTitles";

export type TierVisual = {
  Icon: LucideIcon;
  /** STAGE_VISUALS 키 — 색/글로우 도출용 */
  stage: BadgeStage;
  /** Alert/헤더 칩 등 텍스트 컨텍스트용 fallback 이모지 */
  emoji: string;
};

export const TIER_VISUALS: Record<TierId, TierVisual> = {
  T0: { Icon: MapPin, stage: "entry", emoji: "🧭" },
  T1: { Icon: House, stage: "entry", emoji: "🏠" },
  T2: { Icon: Footprints, stage: "entry", emoji: "👣" },
  T3: { Icon: MapPin, stage: "entry", emoji: "📍" },
  T4: { Icon: Map, stage: "bronze", emoji: "🗺️" },
  T5: { Icon: Backpack, stage: "bronze", emoji: "🎒" },
  T6: { Icon: Compass, stage: "bronze", emoji: "🧭" },
  T7: { Icon: Mountain, stage: "silver", emoji: "🏔️" },
  T8: { Icon: Tent, stage: "silver", emoji: "⛺" },
  T9: { Icon: Plane, stage: "silver", emoji: "✈️" },
  T10: { Icon: Globe, stage: "gold", emoji: "🌍" },
  MASTER: { Icon: Star, stage: "p1", emoji: "⭐️" },
  GRANDMASTER: { Icon: Trophy, stage: "p2", emoji: "🏆" },
  LEGEND: { Icon: Crown, stage: "p3", emoji: "💎" },
  UN_MASTER: { Icon: Award, stage: "p4", emoji: "🌐" },
};
