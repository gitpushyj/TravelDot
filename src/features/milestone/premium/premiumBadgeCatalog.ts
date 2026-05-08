import type { BadgeDefinition } from "../../badges/badges";

// Static catalog of all non-dynamic premium badges. The dynamic
// "premium_four_seasons_<CC>" is handled separately in badgeFromId
// (it's reconstructible from the country code embedded in the ID).
export const PREMIUM_BADGE_DEFS_BY_ID: Record<string, BadgeDefinition> = {
  // A1 N Before N
  premium_n_before_n_5_20:  { id: "premium_n_before_n_5_20",  category: "premium_age", titleKo: "5 Before 20",  titleEn: "5 Before 20",  description: "만 20세 전에 5개국 방문",  emoji: "🏃", rank: 60.5 },
  premium_n_before_n_10_25: { id: "premium_n_before_n_10_25", category: "premium_age", titleKo: "10 Before 25", titleEn: "10 Before 25", description: "만 25세 전에 10개국 방문", emoji: "🏃", rank: 61 },
  premium_n_before_n_20_30: { id: "premium_n_before_n_20_30", category: "premium_age", titleKo: "20 Before 30", titleEn: "20 Before 30", description: "만 30세 전에 20개국 방문", emoji: "🏃", rank: 62 },
  premium_n_before_n_30_40: { id: "premium_n_before_n_30_40", category: "premium_age", titleKo: "30 Before 40", titleEn: "30 Before 40", description: "만 40세 전에 30개국 방문", emoji: "🏃", rank: 63 },
  premium_n_before_n_50_50: { id: "premium_n_before_n_50_50", category: "premium_age", titleKo: "50 Before 50", titleEn: "50 Before 50", description: "만 50세 전에 50개국 방문", emoji: "🏃", rank: 65 },
  // A2 Decade Stamps
  premium_decade_10s:    { id: "premium_decade_10s",    category: "premium_age", titleKo: "10s 컬렉터",    titleEn: "Decade 10s",    description: "10s 시기에 5개국 방문",   emoji: "🌱", rank: 65 },
  premium_decade_20s:    { id: "premium_decade_20s",    category: "premium_age", titleKo: "20s 컬렉터",    titleEn: "Decade 20s",    description: "20s 시기에 15개국 방문",  emoji: "🌟", rank: 65 },
  premium_decade_30s:    { id: "premium_decade_30s",    category: "premium_age", titleKo: "30s 컬렉터",    titleEn: "Decade 30s",    description: "30s 시기에 25개국 방문",  emoji: "🎒", rank: 65 },
  premium_decade_40s:    { id: "premium_decade_40s",    category: "premium_age", titleKo: "40s 컬렉터",    titleEn: "Decade 40s",    description: "40s 시기에 25개국 방문",  emoji: "🧭", rank: 65 },
  premium_decade_50plus: { id: "premium_decade_50plus", category: "premium_age", titleKo: "50plus 컬렉터", titleEn: "Decade 50plus", description: "50plus 시기에 15개국 방문", emoji: "🌅", rank: 65 },
  // A3 Age Match
  premium_age_match_x1:   { id: "premium_age_match_x1",   category: "premium_age", titleKo: "Age x1",   titleEn: "Age Match x1",   description: "현재 만 나이 × 1 이상의 방문국",   emoji: "🎂", rank: 62 },
  premium_age_match_x1_5: { id: "premium_age_match_x1_5", category: "premium_age", titleKo: "Age x1_5", titleEn: "Age Match x1_5", description: "현재 만 나이 × 1.5 이상의 방문국", emoji: "🎉", rank: 62 },
  premium_age_match_x2:   { id: "premium_age_match_x2",   category: "premium_age", titleKo: "Age x2",   titleEn: "Age Match x2",   description: "현재 만 나이 × 2 이상의 방문국",   emoji: "🌠", rank: 62 },
  // C2 Calendar
  premium_calendar_6:  { id: "premium_calendar_6",  category: "premium_time", titleKo: "반년의 여행자", titleEn: "Half-Year Drifter", description: "12개월 중 6개월에 해외 사진", emoji: "📅", rank: 71 },
  premium_calendar_12: { id: "premium_calendar_12", category: "premium_time", titleKo: "달력의 여행자", titleEn: "Calendar Drifter",  description: "12개월 모두 해외 사진",       emoji: "🗓️", rank: 72 },
  // D1 Flag Palette
  premium_flag_palette_5: { id: "premium_flag_palette_5", category: "premium_culture", titleKo: "색의 수집가",  titleEn: "Color Collector",     description: "방문국 국기에서 5색 수집",   emoji: "🎨", rank: 73 },
  premium_flag_palette_7: { id: "premium_flag_palette_7", category: "premium_culture", titleKo: "팔레트 마스터", titleEn: "Flag Palette Master", description: "방문국 국기에서 7색 모두 수집", emoji: "🌈", rank: 74 },
  // D2 UN Linguist
  premium_un_linguist_3: { id: "premium_un_linguist_3", category: "premium_culture", titleKo: "3개 국어의 여행자", titleEn: "Trilingual Traveler", description: "UN 6공용어 중 3개를 공용어로 쓰는 국가 방문", emoji: "🗣️", rank: 75 },
  premium_un_linguist_6: { id: "premium_un_linguist_6", category: "premium_culture", titleKo: "UN 공용어 정복자",   titleEn: "UN Linguist",          description: "UN 6공용어 모두 — 영·중·스페인·프랑스·러시아·아랍", emoji: "🌐", rank: 76 },
  // E1 Humanity
  premium_humanity_25: { id: "premium_humanity_25", category: "premium_share", titleKo: "인류의 4분의 1", titleEn: "Quarter of Humanity",        description: "방문국 인구가 세계 인구의 25% 이상", emoji: "👥", rank: 80 },
  premium_humanity_50: { id: "premium_humanity_50", category: "premium_share", titleKo: "인류의 절반",     titleEn: "Half of Humanity",           description: "방문국 인구가 세계 인구의 50% 이상", emoji: "👥", rank: 80 },
  premium_humanity_75: { id: "premium_humanity_75", category: "premium_share", titleKo: "인류의 4분의 3", titleEn: "Three-Quarters of Humanity", description: "방문국 인구가 세계 인구의 75% 이상", emoji: "👥", rank: 80 },
  // E2 Earth Area
  premium_earth_25: { id: "premium_earth_25", category: "premium_share", titleKo: "지구의 4분의 1", titleEn: "Quarter of Earth",        description: "방문국 면적이 지구 육지의 25% 이상", emoji: "🌍", rank: 80 },
  premium_earth_50: { id: "premium_earth_50", category: "premium_share", titleKo: "지구의 절반",     titleEn: "Half of Earth",           description: "방문국 면적이 지구 육지의 50% 이상", emoji: "🌍", rank: 80 },
  premium_earth_75: { id: "premium_earth_75", category: "premium_share", titleKo: "지구의 4분의 3", titleEn: "Three-Quarters of Earth", description: "방문국 면적이 지구 육지의 75% 이상", emoji: "🌍", rank: 80 },
  // B3 Round the Clock
  premium_round_the_clock: { id: "premium_round_the_clock", category: "premium_special", titleKo: "지구 한 바퀴", titleEn: "Round the Clock", description: "시차 24시간 이상 차이의 두 국가 모두 방문", emoji: "🕛", rank: 85 },
};

export function premiumFourSeasonsBadge(code: string): BadgeDefinition {
  return {
    id: `premium_four_seasons_${code}`,
    category: "premium_time",
    titleKo: `${code} 사계절`,
    titleEn: `${code} Four Seasons`,
    description: `${code} 한 국가에서 4계절 모두 사진을 남김`,
    emoji: "🌸",
    rank: 70,
  };
}
