import populationRaw from "./population.json";
import areaRaw from "./area.json";
import flagColorsRaw from "./flagColors.json";
import officialLanguagesRaw from "./officialLanguages.json";
import utcOffsetRaw from "./utcOffset.json";

export type FlagColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "black"
  | "white";

export type UnLanguage = "en" | "zh" | "es" | "fr" | "ru" | "ar";

export const POPULATION_BY_CODE: Record<string, number> = populationRaw;
export const AREA_BY_CODE: Record<string, number> = areaRaw;
export const FLAG_COLORS_BY_CODE: Record<string, FlagColor[]> =
  flagColorsRaw as Record<string, FlagColor[]>;
export const OFFICIAL_LANGUAGES_BY_CODE: Record<string, UnLanguage[]> =
  officialLanguagesRaw as Record<string, UnLanguage[]>;
export const UTC_OFFSET_BY_CODE: Record<string, number> = utcOffsetRaw;

export { WORLD_POPULATION, EARTH_LAND_AREA_KM2 } from "./constants";
