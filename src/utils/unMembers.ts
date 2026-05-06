// UN 가입국 193개 (ISO 3166-1 alpha-2). NomadMania UN Master 기준과 동일.
// `assets/data/countries.json`은 비UN 영역(홍콩·대만·바티칸·팔레스타인·코소보·
// 맨섬·건지·저지·올란드·페로·그린란드·아루바·퀴라소·신트마르턴·생바르텔레미·
// 생마르탱·케이맨·쿡 제도·니우에·마카오·서사하라·남극) 22개를 포함해 215개를
// 갖고 있다. 메인 화면 통계 분모(/193)와 일관되게 보여주려면 이 셋으로 필터링한다.
const UN_193_LIST = [
  "AF", "AL", "DZ", "AD", "AO", "AG", "AR", "AM", "AU", "AT",
  "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BT",
  "BO", "BA", "BW", "BR", "BN", "BG", "BF", "BI", "CV", "KH",
  "CM", "CA", "CF", "TD", "CL", "CN", "CO", "KM", "CG", "CR",
  "CI", "HR", "CU", "CY", "CZ", "KP", "CD", "DK", "DJ", "DM",
  "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FJ",
  "FI", "FR", "GA", "GM", "GE", "DE", "GH", "GR", "GD", "GT",
  "GN", "GW", "GY", "HT", "HN", "HU", "IS", "IN", "ID", "IR",
  "IQ", "IE", "IL", "IT", "JM", "JP", "JO", "KZ", "KE", "KI",
  "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT",
  "LU", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MR", "MU",
  "MX", "FM", "MD", "MC", "MN", "ME", "MA", "MZ", "MM", "NA",
  "NR", "NP", "NL", "NZ", "NI", "NE", "NG", "MK", "NO", "OM",
  "PK", "PW", "PA", "PG", "PY", "PE", "PH", "PL", "PT", "QA",
  "RO", "RU", "RW", "KN", "LC", "VC", "WS", "SM", "ST", "SA",
  "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA",
  "KR", "SS", "ES", "LK", "SD", "SR", "SE", "CH", "SY", "TJ",
  "TZ", "TH", "TL", "TG", "TO", "TT", "TN", "TR", "TM", "TV",
  "UG", "UA", "AE", "GB", "US", "UY", "UZ", "VU", "VE", "VN",
  "YE", "ZM", "ZW",
];

export const UN_MEMBER_CODES = new Set(UN_193_LIST);

export function isUnMember(code: string): boolean {
  return UN_MEMBER_CODES.has(code);
}
