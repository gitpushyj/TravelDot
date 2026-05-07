import type { TFunction } from "i18next";

import { getCountryName } from "../../lib/countryName";
import type { SupportedLocale } from "../../i18n";
import type { BadgeCategory, BadgeDefinition } from "./badges";
import {
  CONTINENTS,
  ContinentId,
  continentDefinition,
} from "./continents";
import type { TierDefinition } from "../travel/tierTitles";

export function localizedTierTitle(
  tier: TierDefinition,
  t: TFunction
): string {
  return t(`tiers.${tier.id}.title`, { defaultValue: tier.titleKo });
}

export function localizedTierDescription(
  tier: TierDefinition,
  t: TFunction
): string {
  return t(`tiers.${tier.id}.description`, {
    defaultValue: tier.description,
  });
}

export function localizedContinentName(
  id: ContinentId,
  t: TFunction
): string {
  return t(`badges.continent.name.${id}`, {
    defaultValue: continentDefinition(id).nameKo,
  });
}

export function localizedCategoryLabel(
  category: BadgeCategory,
  t: TFunction
): string {
  return t(`badges.category.${category}`, { defaultValue: category });
}

export function localizedBadgeTitle(
  badge: BadgeDefinition,
  t: TFunction,
  locale: SupportedLocale
): string {
  if (badge.id.startsWith("tier_")) {
    const tierId = badge.id.slice(5);
    return t(`tiers.${tierId}.title`, { defaultValue: badge.titleKo });
  }
  if (badge.id.startsWith("days_")) {
    const n = badge.id.slice(5);
    return t(`badges.days.title${n}`, { defaultValue: badge.titleKo });
  }
  if (badge.id.startsWith("foreign_")) {
    const n = badge.id.slice(8);
    return t(`badges.foreign.title${n}`, { defaultValue: badge.titleKo });
  }
  if (badge.id === "continent_AN_pioneer") {
    return t("badges.continent.antarcticaPioneerTitle", {
      defaultValue: badge.titleKo,
    });
  }
  const continentMatch = badge.id.match(
    /^continent_([A-Z]{2})_(wanderer|conqueror)$/
  );
  if (continentMatch) {
    const continentId = continentMatch[1] as ContinentId;
    const continent = localizedContinentName(continentId, t);
    const key =
      continentMatch[2] === "wanderer"
        ? "badges.continent.wandererTitle"
        : "badges.continent.conquerorTitle";
    return t(key, { continent, defaultValue: badge.titleKo });
  }
  const countryMatch = badge.id.match(/^country_([A-Z]{2})_d(\d+)$/);
  if (countryMatch) {
    const code = countryMatch[1];
    const threshold = countryMatch[2];
    const country = getCountryName(code, locale);
    const suffix = t(`badges.country.suffix${threshold}`, {
      defaultValue: "",
    });
    return t("badges.country.title", {
      country,
      suffix,
      defaultValue: badge.titleKo,
    });
  }
  return badge.titleKo;
}

export function localizedBadgeDescription(
  badge: BadgeDefinition,
  t: TFunction,
  locale: SupportedLocale
): string {
  if (badge.id.startsWith("tier_")) {
    const tierId = badge.id.slice(5);
    return t(`tiers.${tierId}.description`, {
      defaultValue: badge.description,
    });
  }
  if (badge.id.startsWith("days_")) {
    const threshold = Number(badge.id.slice(5));
    return t("badges.days.description", {
      threshold,
      defaultValue: badge.description,
    });
  }
  if (badge.id.startsWith("foreign_")) {
    const threshold = Number(badge.id.slice(8));
    return t("badges.foreign.description", {
      threshold,
      defaultValue: badge.description,
    });
  }
  if (badge.id === "continent_AN_pioneer") {
    return t("badges.continent.antarcticaPioneerDescription", {
      defaultValue: badge.description,
    });
  }
  const continentMatch = badge.id.match(
    /^continent_([A-Z]{2})_(wanderer|conqueror)$/
  );
  if (continentMatch) {
    const continentId = continentMatch[1] as ContinentId;
    const continent = localizedContinentName(continentId, t);
    const def = CONTINENTS.find((c) => c.id === continentId);
    const count =
      continentMatch[2] === "wanderer" ? def?.wanderer : def?.conqueror;
    const key =
      continentMatch[2] === "wanderer"
        ? "badges.continent.wandererDescription"
        : "badges.continent.conquerorDescription";
    return t(key, {
      continent,
      count: count ?? 0,
      defaultValue: badge.description,
    });
  }
  const countryMatch = badge.id.match(/^country_([A-Z]{2})_d(\d+)$/);
  if (countryMatch) {
    const code = countryMatch[1];
    const threshold = Number(countryMatch[2]);
    const country = getCountryName(code, locale);
    return t("badges.country.description", {
      country,
      threshold,
      defaultValue: badge.description,
    });
  }
  return badge.description;
}
