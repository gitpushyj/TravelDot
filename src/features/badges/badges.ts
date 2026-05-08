// 뱃지 카탈로그 + 사용자 통계 → 잠금 해제된 뱃지 평가.
// 기획서 §4.3 (v2 구현 범위) 참조: docs/마일스톤_뱃지_기획서.md

import {
  CONTINENTS,
  ContinentId,
  continentDefinition,
  continentOf,
} from "./continents";
import { getTierByCount, TierDefinition, TIERS } from "../travel/tierTitles";
import { TIER_VISUALS } from "../travel/tierVisuals";
import { flagEmoji } from "../../utils/flag";

export type BadgeCategory =
  | "tier" // 등급 (T1~UN_MASTER)
  | "days" // 누적 여행 일수
  | "continent" // 대륙 탐방가/정복자
  | "country" // 국가 단골(동적, 코드별)
  | "foreign"; // 해외 사진 누적

export type BadgeId = string;

export type BadgeDefinition = {
  id: BadgeId;
  category: BadgeCategory;
  titleKo: string;
  titleEn: string;
  description: string;
  /** UI 좌측 표시 — 이모지 한 글자 */
  emoji: string;
  /** 명예/희귀도 정렬용 — 큰 값일수록 위. tier > 등급/명예에 비례, 일반 뱃지는 0~5 */
  rank: number;
  /** 등급 뱃지 식별 — Settings에서 자동 갱신 처리에 사용 */
  isTier?: boolean;
};

export type BadgeStats = {
  /** 본국 포함 고유 방문 국가 수 */
  visitedCountriesCount: number;
  /** 누적 여행 일수 (visit_days 전체 행 수) */
  totalDays: number;
  /** 국가코드별 일수 (visitCounts 그대로) */
  daysByCountry: Record<string, number>;
  /** 해외(본국 제외) 사진 장 수 */
  foreignPhotoCount: number;
};

const DAY_TIERS: { threshold: number; titleKo: string; titleEn: string; rank: number }[] = [
  { threshold: 7, titleKo: "일주의 여행자", titleEn: "Weekender", rank: 1 },
  { threshold: 30, titleKo: "한 달의 방랑", titleEn: "Monthly Wanderer", rank: 2 },
  { threshold: 100, titleKo: "백일의 여정", titleEn: "Centenary Voyager", rank: 3 },
  { threshold: 365, titleKo: "일년의 방랑자", titleEn: "Yearling Drifter", rank: 4 },
  { threshold: 730, titleKo: "두 해의 떠돌이", titleEn: "Biennial Drifter", rank: 5 },
  { threshold: 1000, titleKo: "영원한 여행자", titleEn: "Eternal Traveler", rank: 6 },
];

const COUNTRY_TIERS: { threshold: number; suffixKo: string; suffixEn: string; rank: number }[] = [
  { threshold: 30, suffixKo: "단골", suffixEn: "Regular", rank: 1 },
  { threshold: 100, suffixKo: "제2의 고향", suffixEn: "Second Home", rank: 2 },
  { threshold: 365, suffixKo: "토박이", suffixEn: "Local", rank: 3 },
];

const FOREIGN_TIERS: { threshold: number; titleKo: string; titleEn: string; rank: number }[] = [
  { threshold: 100, titleKo: "해외 콜렉터", titleEn: "Overseas Collector", rank: 1 },
  { threshold: 500, titleKo: "해외 마니아", titleEn: "Overseas Enthusiast", rank: 2 },
  { threshold: 1000, titleKo: "해외 마스터", titleEn: "Overseas Master", rank: 3 },
  { threshold: 3000, titleKo: "해외 전설", titleEn: "Overseas Legend", rank: 4 },
];

function tierBadge(tier: TierDefinition): BadgeDefinition {
  // 명예 등급은 더 높은 rank
  const rank = tier.prestige ? 100 + tier.prestige : 50 + Number(tier.id.replace("T", "")) || 50;
  return {
    id: `tier_${tier.id}`,
    category: "tier",
    titleKo: tier.titleKo,
    titleEn: tier.titleEn,
    description: tier.description,
    emoji: TIER_VISUALS[tier.id].emoji,
    rank,
    isTier: true,
  };
}

function dayBadge(t: { threshold: number; titleKo: string; titleEn: string; rank: number }): BadgeDefinition {
  return {
    id: `days_${t.threshold}`,
    category: "days",
    titleKo: t.titleKo,
    titleEn: t.titleEn,
    description: `누적 여행 ${t.threshold}일 이상`,
    emoji: t.threshold >= 1000 ? "🌟" : t.threshold >= 365 ? "📆" : "🗓️",
    rank: 10 + t.rank,
  };
}

function continentBadge(
  continent: ContinentId,
  kind: "initiate" | "wanderer" | "conqueror"
): BadgeDefinition {
  const def = continentDefinition(continent);
  if (continent === "AN") {
    // 남극: 입문 단계 미적용 — 기존 pioneer 호칭 그대로 emit.
    return {
      id: `continent_AN_pioneer`,
      category: "continent",
      titleKo: "남극 탐험가",
      titleEn: "Antarctica Pioneer",
      description: "지구 최남단까지 발자취를 남긴 사람",
      emoji: "🐧",
      rank: 30,
    };
  }
  if (kind === "initiate") {
    return {
      id: `continent_${continent}_initiate`,
      category: "continent",
      titleKo: `${def.nameKo} 여행자`,
      titleEn: `${def.nameEn} Traveler`,
      description: `${def.nameKo}에서 ${def.initiate}개국 이상 방문`,
      emoji: emojiForContinent(continent),
      rank: 18,
    };
  }
  if (kind === "wanderer") {
    return {
      id: `continent_${continent}_wanderer`,
      category: "continent",
      titleKo: `${def.nameKo} 탐방가`,
      titleEn: `${def.nameEn} Wanderer`,
      description: `${def.nameKo}에서 ${def.wanderer}개국 이상 방문`,
      emoji: emojiForContinent(continent),
      rank: 20,
    };
  }
  return {
    id: `continent_${continent}_conqueror`,
    category: "continent",
    titleKo: `${def.nameKo} 정복자`,
    titleEn: `${def.nameEn} Conqueror`,
    description: `${def.nameKo}에서 ${def.conqueror}개국 이상 방문`,
    emoji: emojiForContinent(continent),
    rank: 25,
  };
}

function emojiForContinent(c: ContinentId): string {
  switch (c) {
    case "AS": return "🌏";
    case "EU": return "🏰";
    case "AF": return "🦁";
    case "NA": return "🗽";
    case "SA": return "🌴";
    case "OC": return "🏝️";
    case "AN": return "🐧";
  }
}

function countryBadge(
  code: string,
  countryNameKo: string,
  tier: { threshold: number; suffixKo: string; suffixEn: string; rank: number }
): BadgeDefinition {
  return {
    id: `country_${code}_d${tier.threshold}`,
    category: "country",
    titleKo: `${countryNameKo} ${tier.suffixKo}`,
    titleEn: `${code} ${tier.suffixEn}`,
    description: `${countryNameKo}에서 ${tier.threshold}일 이상 머무른 사람`,
    emoji: flagEmoji(code),
    rank: 15 + tier.rank,
  };
}

function foreignBadge(t: { threshold: number; titleKo: string; titleEn: string; rank: number }): BadgeDefinition {
  return {
    id: `foreign_${t.threshold}`,
    category: "foreign",
    titleKo: t.titleKo,
    titleEn: t.titleEn,
    description: `해외에서 사진 ${t.threshold}장 이상 촬영`,
    emoji: t.threshold >= 3000 ? "📸" : "🎞️",
    rank: 18 + t.rank,
  };
}

/**
 * 현재 통계로부터 잠금 해제된 모든 뱃지를 평가한다.
 * 등급 뱃지(T0 제외) + 일수 + 대륙 + 국가 + 해외사진.
 *
 * @param stats 사용자 누적 통계
 * @param countryNameByCode 국가코드 → 한국어명 (UI에 들어갈 동적 라벨용)
 */
export function evaluateBadges(
  stats: BadgeStats,
  countryNameByCode: Record<string, string>
): BadgeDefinition[] {
  const out: BadgeDefinition[] = [];

  // 등급 뱃지 — 도달한 모든 등급을 emit (회고 뱃지 보존 §4.2).
  // 사용자가 과거 등급을 호칭으로 선택할 수 있도록 history를 보존한다.
  for (const tier of TIERS) {
    if (tier.id === "T0") continue;
    if (stats.visitedCountriesCount >= tier.threshold) out.push(tierBadge(tier));
  }

  // 일수 뱃지
  for (const t of DAY_TIERS) {
    if (stats.totalDays >= t.threshold) out.push(dayBadge(t));
  }

  // 대륙별 카운트 집계
  const byContinent: Record<ContinentId, number> = {
    AS: 0, EU: 0, AF: 0, NA: 0, SA: 0, OC: 0, AN: 0,
  };
  for (const code of Object.keys(stats.daysByCountry)) {
    const cont = continentOf(code);
    if (cont) byContinent[cont] += 1;
  }
  for (const cont of CONTINENTS) {
    const n = byContinent[cont.id];
    if (cont.id === "AN") {
      if (n >= 1) out.push(continentBadge("AN", "conqueror"));
      continue;
    }
    if (n >= cont.initiate) out.push(continentBadge(cont.id, "initiate"));
    if (n >= cont.wanderer) out.push(continentBadge(cont.id, "wanderer"));
    if (n >= cont.conqueror) out.push(continentBadge(cont.id, "conqueror"));
  }

  // 국가 단골 (동적)
  for (const [code, days] of Object.entries(stats.daysByCountry)) {
    const koName = countryNameByCode[code] ?? code;
    for (const t of COUNTRY_TIERS) {
      if (days >= t.threshold) out.push(countryBadge(code, koName, t));
    }
  }

  // 해외 사진왕
  for (const t of FOREIGN_TIERS) {
    if (stats.foreignPhotoCount >= t.threshold) out.push(foreignBadge(t));
  }

  return out;
}

/**
 * BadgeId로부터 뱃지 정의를 복원한다. 동적 뱃지(국가 단골)도 ID에서 메타데이터를 추출.
 * 카탈로그에 없는 뱃지(잠금 해제 후 사용자가 본국을 바꿔 국가가 사라진 경우 등)도 표시는 가능해야 한다.
 */
export function badgeFromId(
  id: BadgeId,
  countryNameByCode: Record<string, string>
): BadgeDefinition | null {
  if (id.startsWith("tier_")) {
    const tierId = id.slice(5);
    const tier = TIERS.find((t) => t.id === tierId);
    if (!tier) return null;
    return tierBadge(tier);
  }
  if (id.startsWith("days_")) {
    const n = Number(id.slice(5));
    const t = DAY_TIERS.find((d) => d.threshold === n);
    return t ? dayBadge(t) : null;
  }
  if (id.startsWith("foreign_")) {
    const n = Number(id.slice(8));
    const t = FOREIGN_TIERS.find((d) => d.threshold === n);
    return t ? foreignBadge(t) : null;
  }
  if (id.startsWith("continent_")) {
    const rest = id.slice(10);
    if (rest === "AN_pioneer") return continentBadge("AN", "conqueror");
    const m = rest.match(/^([A-Z]{2})_(initiate|wanderer|conqueror)$/);
    if (!m) return null;
    return continentBadge(
      m[1] as ContinentId,
      m[2] as "initiate" | "wanderer" | "conqueror"
    );
  }
  if (id.startsWith("country_")) {
    const m = id.match(/^country_([A-Z]{2})_d(\d+)$/);
    if (!m) return null;
    const code = m[1];
    const threshold = Number(m[2]);
    const t = COUNTRY_TIERS.find((c) => c.threshold === threshold);
    if (!t) return null;
    const koName = countryNameByCode[code] ?? code;
    return countryBadge(code, koName, t);
  }
  return null;
}

/**
 * 카테고리별 모든 정적(non-country) 뱃지 카탈로그.
 * 호칭 상세 화면에서 잠금 상태로 보여줄 풀 리스트를 만들기 위해 사용한다.
 *
 * 국가 단골은 215개국 × 3단계 = 645개라 너무 많아 정적으로 노출하지 않고,
 * 잠금 해제된 인스턴스만 별도로 표시한다.
 */
export function getStaticBadgeCatalog(): BadgeDefinition[] {
  const out: BadgeDefinition[] = [];
  for (const tier of TIERS) {
    if (tier.id === "T0") continue;
    out.push(tierBadge(tier));
  }
  for (const t of DAY_TIERS) out.push(dayBadge(t));
  for (const cont of CONTINENTS) {
    if (cont.id === "AN") {
      out.push(continentBadge("AN", "conqueror"));
    } else {
      out.push(continentBadge(cont.id, "initiate"));
      out.push(continentBadge(cont.id, "wanderer"));
      out.push(continentBadge(cont.id, "conqueror"));
    }
  }
  for (const t of FOREIGN_TIERS) out.push(foreignBadge(t));
  return out;
}

/** 카테고리별 한국어 라벨 */
export const CATEGORY_LABEL: Record<BadgeCategory, string> = {
  tier: "등급",
  days: "여행 일수",
  continent: "대륙",
  country: "국가 단골",
  foreign: "해외 사진",
};

/** 호칭 상세 화면에서 카테고리 노출 순서 */
export const CATEGORY_ORDER: readonly BadgeCategory[] = [
  "tier",
  "days",
  "continent",
  "country",
  "foreign",
];

/**
 * 정렬: rank 내림차순. 같으면 id 사전순.
 */
export function sortBadges(badges: BadgeDefinition[]): BadgeDefinition[] {
  return [...badges].sort((a, b) => {
    if (b.rank !== a.rank) return b.rank - a.rank;
    return a.id.localeCompare(b.id);
  });
}
