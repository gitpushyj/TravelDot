import type { TFunction } from "i18next";

import { getCountryName } from "../../lib/countryName";
import type { SupportedLocale } from "../../i18n";
import type { BadgeCategory, BadgeDefinition } from "./badges";
import {
  CONTINENTS,
  ContinentId,
  continentDefinition,
} from "./continents";
import { TIERS, type TierDefinition } from "../travel/tierTitles";

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
    /^continent_([A-Z]{2})_(initiate|wanderer|conqueror)$/
  );
  if (continentMatch) {
    const continentId = continentMatch[1] as ContinentId;
    const continent = localizedContinentName(continentId, t);
    const stage = continentMatch[2] as "initiate" | "wanderer" | "conqueror";
    const key =
      stage === "initiate"
        ? "badges.continent.initiateTitle"
        : stage === "wanderer"
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
  if (badge.id.startsWith("premium_")) {
    return t(`badges.premium.${badge.id}.title`, {
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
    /^continent_([A-Z]{2})_(initiate|wanderer|conqueror)$/
  );
  if (continentMatch) {
    const continentId = continentMatch[1] as ContinentId;
    const continent = localizedContinentName(continentId, t);
    const def = CONTINENTS.find((c) => c.id === continentId);
    const stage = continentMatch[2] as "initiate" | "wanderer" | "conqueror";
    const count =
      stage === "initiate"
        ? def?.initiate
        : stage === "wanderer"
          ? def?.wanderer
          : def?.conqueror;
    const key =
      stage === "initiate"
        ? "badges.continent.initiateDescription"
        : stage === "wanderer"
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
  if (badge.id.startsWith("premium_")) {
    return t(`badges.premium.${badge.id}.description`, {
      defaultValue: badge.description,
    });
  }
  return badge.description;
}

/**
 * 공유 카드 등 "객관적 달성 조건"만 보여줘야 하는 곳에서 사용.
 *
 * tier 호칭의 i18n description은 "여행이 슬슬 익숙해지는" 같은 감성 문구라
 * 공유 카드에 들어가면 의미가 모호하다. tier만 threshold 기반 조건문으로 바꾸고,
 * 나머지(days/continent/country/foreign/premium)는 이미 조건형이라 그대로 사용한다.
 */
export function localizedBadgeObjective(
  badge: BadgeDefinition,
  t: TFunction,
  locale: SupportedLocale
): string {
  if (badge.id.startsWith("tier_")) {
    const tierId = badge.id.slice(5);
    const tier = TIERS.find((tt) => tt.id === tierId);
    if (tier && tier.threshold > 0) {
      if (tierId === "UN_MASTER") {
        return t("badges.tier.conditionAll", {
          count: tier.threshold,
          defaultValue: `전 세계 ${tier.threshold}개국 모두 방문`,
        });
      }
      return t("badges.tier.condition", {
        count: tier.threshold,
        defaultValue: `${tier.threshold}개국 이상 방문`,
      });
    }
  }
  return localizedBadgeDescription(badge, t, locale);
}
