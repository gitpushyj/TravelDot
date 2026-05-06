// 국가 코드(ISO 3166-1 alpha-2) → 대륙 매핑.
// `assets/data/countries.json`에 들어 있는 215개 항목을 모두 분류한다.
//
// 사용 정책:
//   - 러시아: EU(인구·정치 중심 기준)
//   - 터키/사이프러스: 사이프러스는 EU(EU 가입국), 터키는 AS
//   - 카리브 / 중미 → NA
//   - 남극(AQ) → AN
//
// 분류는 사용자가 체감하는 "대륙 정복" 의미를 우선한다.

export type ContinentId = "AS" | "EU" | "AF" | "NA" | "SA" | "OC" | "AN";

export type ContinentDefinition = {
  id: ContinentId;
  nameKo: string;
  nameEn: string;
  /** 탐방가 컷오프 */
  wanderer: number;
  /** 정복자 컷오프 */
  conqueror: number;
};

export const CONTINENTS: readonly ContinentDefinition[] = [
  { id: "AS", nameKo: "아시아", nameEn: "Asia", wanderer: 5, conqueror: 12 },
  { id: "EU", nameKo: "유럽", nameEn: "Europe", wanderer: 5, conqueror: 15 },
  { id: "AF", nameKo: "아프리카", nameEn: "Africa", wanderer: 4, conqueror: 10 },
  { id: "NA", nameKo: "북아메리카", nameEn: "North America", wanderer: 3, conqueror: 8 },
  { id: "SA", nameKo: "남아메리카", nameEn: "South America", wanderer: 3, conqueror: 7 },
  { id: "OC", nameKo: "오세아니아", nameEn: "Oceania", wanderer: 2, conqueror: 5 },
  // 남극: 방문 1개국으로 특수 뱃지 처리. wanderer=conqueror=1 형태.
  { id: "AN", nameKo: "남극", nameEn: "Antarctica", wanderer: 1, conqueror: 1 },
];

const ASIA = [
  "AE", "AF", "AM", "AZ", "BD", "BH", "BN", "BT", "CN", "GE",
  "HK", "ID", "IL", "IN", "IQ", "IR", "JO", "JP", "KG", "KH",
  "KP", "KR", "KW", "KZ", "LA", "LB", "LK", "MM", "MN", "MO",
  "MV", "MY", "NP", "OM", "PH", "PK", "PS", "QA", "SA", "SG",
  "SY", "TH", "TJ", "TL", "TM", "TR", "TW", "UZ", "VN", "YE",
];

const EUROPE = [
  "AD", "AL", "AT", "AX", "BA", "BE", "BG", "BY", "CH", "CY",
  "CZ", "DE", "DK", "EE", "ES", "FI", "FO", "FR", "GB", "GG",
  "GR", "HR", "HU", "IE", "IM", "IS", "IT", "JE", "LI", "LT",
  "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO", "PL",
  "PT", "RO", "RS", "RU", "SE", "SI", "SK", "SM", "UA", "VA",
  "XK",
];

const AFRICA = [
  "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM",
  "CV", "DJ", "DZ", "EG", "EH", "ER", "ET", "GA", "GH", "GM",
  "GN", "GQ", "GW", "KE", "KM", "LR", "LS", "LY", "MA", "MG",
  "ML", "MR", "MU", "MW", "MZ", "NA", "NE", "NG", "RW", "SC",
  "SD", "SL", "SN", "SO", "SS", "ST", "SZ", "TD", "TG", "TN",
  "TZ", "UG", "ZA", "ZM", "ZW",
];

const NORTH_AMERICA = [
  "AG", "AW", "BB", "BL", "BS", "BZ", "CA", "CR", "CU", "CW",
  "DM", "DO", "GD", "GL", "GT", "HN", "HT", "JM", "KN", "KY",
  "LC", "MF", "MX", "NI", "PA", "SV", "SX", "TT", "US", "VC",
];

const SOUTH_AMERICA = [
  "AR", "BO", "BR", "CL", "CO", "EC", "GY", "PE", "PY", "SR",
  "UY", "VE",
];

const OCEANIA = [
  "AU", "CK", "FJ", "FM", "KI", "MH", "NR", "NU", "NZ", "PG",
  "PW", "SB", "TO", "TV", "VU", "WS",
];

const ANTARCTICA = ["AQ"];

export const CONTINENT_BY_CODE: Record<string, ContinentId> = (() => {
  const m: Record<string, ContinentId> = {};
  for (const c of ASIA) m[c] = "AS";
  for (const c of EUROPE) m[c] = "EU";
  for (const c of AFRICA) m[c] = "AF";
  for (const c of NORTH_AMERICA) m[c] = "NA";
  for (const c of SOUTH_AMERICA) m[c] = "SA";
  for (const c of OCEANIA) m[c] = "OC";
  for (const c of ANTARCTICA) m[c] = "AN";
  return m;
})();

export function continentOf(code: string): ContinentId | null {
  return CONTINENT_BY_CODE[code] ?? null;
}

export function continentDefinition(id: ContinentId): ContinentDefinition {
  return CONTINENTS.find((c) => c.id === id)!;
}
