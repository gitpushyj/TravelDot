// 국가 인기도 순위. 인덱스가 작을수록 인기가 높다.
// 기준: 국제 관광객 도착수(UNWTO 통계)에 기반한 대략적인 톱 100.
// 명단에 없는 국가는 동순위(가장 낮음)로 처리한다.
const POPULARITY_ORDER: string[] = [
  "FR", "ES", "US", "CN", "IT", "TR", "MX", "TH", "DE", "GB",
  "JP", "AT", "GR", "PT", "MY", "RU", "HK", "NL", "CA", "PL",
  "SA", "KR", "HU", "HR", "SG", "AE", "CZ", "CH", "ID", "VN",
  "BE", "SE", "IE", "DK", "EG", "MA", "IN", "AU", "ZA", "RO",
  "BG", "NO", "FI", "BR", "AR", "NZ", "IL", "PH", "TW", "IS",
  "CL", "PE", "CU", "DO", "JO", "LB", "SK", "SI", "EE", "LV",
  "LT", "KH", "LK", "NP", "MM", "LA", "BD", "PK", "IR", "KZ",
  "UZ", "GE", "AM", "AZ", "RS", "AL", "BA", "ME", "MK", "CY",
  "MT", "LU", "KE", "TZ", "UG", "ET", "NG", "GH", "SN", "CO",
  "EC", "UY", "CR", "PA", "GT", "NI", "JM", "BS", "MV", "MU",
  "SC", "QA", "KW", "OM", "BH", "MN",
];

const RANK_MAP: Record<string, number> = {};
POPULARITY_ORDER.forEach((code, i) => {
  RANK_MAP[code] = i + 1;
});

const FALLBACK_RANK = POPULARITY_ORDER.length + 1;

export function popularityRank(code: string): number {
  return RANK_MAP[code] ?? FALLBACK_RANK;
}
