import { KO_NAME_BY_CODE } from "./countryLookup";
import type { SupportedLocale } from "../i18n";

// 한국어는 큐레이션된 명칭(예: "북한", "터키")을 유지하기 위해 별도 매핑을 쓴다.
// 그 외 locale은 i18n 폴리필(@formatjs/intl-displaynames)이 모든 플랫폼에서
// Intl.DisplayNames를 보장한다.
export function getCountryName(
  code: string,
  locale: SupportedLocale
): string {
  if (locale === "ko") return KO_NAME_BY_CODE[code] ?? code;
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    const name = dn.of(code);
    if (name && name !== code) return name;
  } catch {}
  return code;
}
