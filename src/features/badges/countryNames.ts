// 국가 코드 → 한국어명 매핑. 동적 뱃지(국가 단골) 라벨 생성에 사용.
import countriesJson from "../../../assets/data/countries.json";

type CountryEntry = { code: string; name: string; nameKo: string };

const list = countriesJson as CountryEntry[];

export const COUNTRY_NAME_KO_BY_CODE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const c of list) m[c.code] = c.nameKo;
  return m;
})();
