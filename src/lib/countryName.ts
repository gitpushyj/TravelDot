import { KO_NAME_BY_CODE, COUNTRY_LIST } from "./countryLookup";
import type { SupportedLocale } from "../i18n";

const ENGLISH_NAME_BY_CODE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const c of COUNTRY_LIST) m[c.code] = c.name;
  return m;
})();

export function getCountryName(
  code: string,
  locale: SupportedLocale
): string {
  if (locale === "ko") return KO_NAME_BY_CODE[code] ?? code;
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    const name = dn.of(code);
    if (name && name !== code) return name;
  } catch {
    // 일부 환경에서 Intl.DisplayNames 미지원 — 영어 fallback.
  }
  return ENGLISH_NAME_BY_CODE[code] ?? KO_NAME_BY_CODE[code] ?? code;
}
