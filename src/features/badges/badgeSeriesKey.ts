import type { BadgeId } from "./badges";

/**
 * 같은 "시리즈" 호칭을 한 묶음으로 보고자 할 때 쓰는 그룹 키.
 *
 * - 등급(tier_*)·일수(days_*)·해외 사진(foreign_*) → 카테고리 단위 한 묶음
 * - 대륙(continent_AS_*)·국가 단골(country_KR_*) → 대륙/국가 단위 한 묶음
 * - 프리미엄(premium_calendar_6/12 등) → 끝의 _숫자를 떼어 패밀리 단위 한 묶음
 *
 * 공유 카드 크레딧에서 동일 시리즈의 하위 단계를 중복으로 노출하지 않기 위해 사용한다.
 */
export function badgeSeriesKey(id: BadgeId): string {
  if (id.startsWith("tier_")) return "tier";
  if (id.startsWith("days_")) return "days";
  if (id.startsWith("foreign_")) return "foreign";

  const continentMatch = id.match(/^continent_([A-Z]{2})_/);
  if (continentMatch) return `continent_${continentMatch[1]}`;

  const countryMatch = id.match(/^country_([A-Z]{2})_d/);
  if (countryMatch) return `country_${countryMatch[1]}`;

  if (id.startsWith("premium_")) return id.replace(/_\d+$/, "");

  return id;
}
