import countriesJson from "../../assets/data/countries.json";

// UN 가입국 193개 기준 (NomadMania UN Master와 정렬)
export const TOTAL_COUNTRIES = 193;

export type CountryEntry = { code: string; name: string; nameKo: string };

export const COUNTRY_LIST = countriesJson as CountryEntry[];

export const KO_NAME_BY_CODE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const c of COUNTRY_LIST) m[c.code] = c.nameKo;
  return m;
})();
