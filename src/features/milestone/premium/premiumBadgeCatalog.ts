import type { BadgeDefinition } from "../../badges/badges";

// Static catalog of all premium badges currently in scope.
// 단계 1 범위 외 호칭(premium_n_before_n_*, premium_decade_*, premium_four_seasons_*)은
// 사용자 결정으로 제거됨 — 평가도 부여도 하지 않는다.
export const PREMIUM_BADGE_DEFS_BY_ID: Record<string, BadgeDefinition> = {
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
