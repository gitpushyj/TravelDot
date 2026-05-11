import airportData from "../../../assets/data/airports.json";

export type Airport = {
  iata: string;
  name: string;
  city: string;
  country: string; // ISO-3166-1 alpha-2
  lat: number;
  lng: number;
};

const ALL_AIRPORTS = airportData as Airport[];
const BY_IATA = new Map<string, Airport>(
  ALL_AIRPORTS.map((a) => [a.iata.toUpperCase(), a])
);

export function getAirportByIata(iata: string): Airport | undefined {
  return BY_IATA.get(iata.toUpperCase());
}

export function allAirports(): readonly Airport[] {
  return ALL_AIRPORTS;
}

// 공항 검색. IATA 코드 / 영문 도시명·공항명 / 국가코드 부분 일치.
// 한국어 입력은 별도 매핑 없이도 도시명을 영문으로 적으면 매칭된다.
// 한국어 흔한 도시 동의어는 KO_CITY_ALIASES에 추가해 라이브 한국어 검색 지원.
const KO_CITY_ALIASES: Record<string, string[]> = {
  seoul: ["서울", "인천", "김포"],
  busan: ["부산"],
  jeju: ["제주"],
  daegu: ["대구"],
  gwangju: ["광주"],
  cheongju: ["청주"],
  muan: ["무안"],
  ulsan: ["울산"],
  yeosu: ["여수"],

  tokyo: ["도쿄", "동경", "나리타", "하네다"],
  osaka: ["오사카", "간사이"],
  nagoya: ["나고야"],
  fukuoka: ["후쿠오카"],
  sapporo: ["삿포로"],
  okinawa: ["오키나와", "나하"],
  hiroshima: ["히로시마"],
  sendai: ["센다이"],

  beijing: ["베이징", "북경"],
  shanghai: ["상하이", "상해"],
  guangzhou: ["광저우", "광주(중국)"],
  shenzhen: ["선전", "심천"],
  chengdu: ["청두", "성도"],
  "xi'an": ["시안", "서안"],
  "hong kong": ["홍콩"],
  macau: ["마카오"],
  taipei: ["타이베이", "타이페이"],
  kaohsiung: ["가오슝"],

  bangkok: ["방콕"],
  phuket: ["푸켓"],
  "chiang mai": ["치앙마이"],
  "koh samui": ["사무이", "코사무이"],
  krabi: ["크라비"],
  singapore: ["싱가포르"],
  "kuala lumpur": ["쿠알라룸푸르"],
  penang: ["페낭"],
  "kota kinabalu": ["코타키나발루"],
  jakarta: ["자카르타"],
  denpasar: ["발리", "덴파사르"],
  surabaya: ["수라바야"],
  manila: ["마닐라"],
  cebu: ["세부"],
  hanoi: ["하노이"],
  "ho chi minh city": ["호치민", "사이공"],
  "da nang": ["다낭"],
  "nha trang": ["나트랑", "냐짱"],
  "phnom penh": ["프놈펜"],
  "siem reap": ["씨엠립", "시엠레아프"],
  vientiane: ["비엔티안"],
  yangon: ["양곤"],

  "new delhi": ["델리", "뉴델리"],
  mumbai: ["뭄바이"],
  bangalore: ["벵갈루루", "방갈로르"],
  chennai: ["첸나이"],
  hyderabad: ["하이데라바드"],
  kolkata: ["콜카타"],
  goa: ["고아"],
  colombo: ["콜롬보"],
  kathmandu: ["카트만두"],
  dhaka: ["다카"],
  "malé": ["몰디브", "말레"],

  "los angeles": ["로스앤젤레스", "엘에이", "LA"],
  "san francisco": ["샌프란시스코"],
  "new york": ["뉴욕"],
  newark: ["뉴어크"],
  chicago: ["시카고"],
  atlanta: ["애틀랜타"],
  dallas: ["댈러스"],
  houston: ["휴스턴"],
  seattle: ["시애틀"],
  miami: ["마이애미"],
  orlando: ["올랜도"],
  "las vegas": ["라스베이거스"],
  phoenix: ["피닉스"],
  "san diego": ["샌디에이고"],
  boston: ["보스턴"],
  denver: ["덴버"],
  honolulu: ["호놀룰루", "하와이"],
  washington: ["워싱턴"],
  portland: ["포틀랜드"],
  minneapolis: ["미니애폴리스"],
  detroit: ["디트로이트"],
  philadelphia: ["필라델피아"],
  charlotte: ["샬럿"],
  anchorage: ["앵커리지"],
  "hagåtña": ["괌"],

  toronto: ["토론토"],
  vancouver: ["밴쿠버"],
  montreal: ["몬트리올"],
  calgary: ["캘거리"],
  "mexico city": ["멕시코시티"],
  "cancún": ["칸쿤"],
  "são paulo": ["상파울루"],
  "rio de janeiro": ["리우", "리우데자네이루"],
  "buenos aires": ["부에노스아이레스"],
  santiago: ["산티아고"],
  lima: ["리마"],
  "bogotá": ["보고타"],

  london: ["런던"],
  manchester: ["맨체스터"],
  edinburgh: ["에든버러"],
  dublin: ["더블린"],
  paris: ["파리"],
  nice: ["니스"],
  frankfurt: ["프랑크푸르트"],
  munich: ["뮌헨"],
  berlin: ["베를린"],
  hamburg: ["함부르크"],
  "düsseldorf": ["뒤셀도르프"],
  amsterdam: ["암스테르담"],
  brussels: ["브뤼셀"],
  zurich: ["취리히"],
  geneva: ["제네바"],
  vienna: ["비엔나", "빈"],
  rome: ["로마"],
  milan: ["밀라노"],
  venice: ["베네치아", "베니스"],
  naples: ["나폴리"],
  madrid: ["마드리드"],
  barcelona: ["바르셀로나"],
  palma: ["팔마"],
  lisbon: ["리스본"],
  porto: ["포르투"],
  copenhagen: ["코펜하겐"],
  stockholm: ["스톡홀름"],
  oslo: ["오슬로"],
  helsinki: ["헬싱키"],
  "reykjavík": ["레이캬비크"],
  warsaw: ["바르샤바"],
  prague: ["프라하"],
  budapest: ["부다페스트"],
  athens: ["아테네"],
  istanbul: ["이스탄불"],
  moscow: ["모스크바"],
  "saint petersburg": ["상트페테르부르크"],
  vladivostok: ["블라디보스토크"],

  dubai: ["두바이"],
  "abu dhabi": ["아부다비"],
  doha: ["도하"],
  riyadh: ["리야드"],
  jeddah: ["제다"],
  manama: ["마나마"],
  "kuwait city": ["쿠웨이트"],
  "tel aviv": ["텔아비브"],
  cairo: ["카이로"],
  johannesburg: ["요하네스버그"],
  "cape town": ["케이프타운"],
  nairobi: ["나이로비"],
  "addis ababa": ["아디스아바바"],
  casablanca: ["카사블랑카"],
  lagos: ["라고스"],

  sydney: ["시드니"],
  melbourne: ["멜버른"],
  brisbane: ["브리즈번"],
  perth: ["퍼스"],
  adelaide: ["애들레이드"],
  cairns: ["케언즈"],
  auckland: ["오클랜드"],
  christchurch: ["크라이스트처치"],
  wellington: ["웰링턴"],
  nadi: ["나디", "피지"],
};

// IATA 코드별 추가 별칭. OurAirports의 city 표기와 사용자가 검색할 도시명이
// 일치하지 않는 케이스(예: NRT=Narita인데 사용자는 "도쿄"로 검색, KUL=Sepang/
// 쿠알라룸푸르, DPS=Kuta/발리 등)를 보완한다.
const IATA_ALIASES: Record<string, string[]> = {
  CJU: ["제주"],
  NRT: ["도쿄", "동경", "tokyo"],
  HND: ["도쿄", "동경"],
  KUL: ["쿠알라룸푸르", "kuala lumpur"],
  DPS: ["발리", "덴파사르", "denpasar", "bali"],
  TPE: ["타이베이", "타이페이", "taipei"],
  TSA: ["타이베이", "taipei"],
  MFM: ["마카오", "macau"],
  GRU: ["상파울루", "sao paulo"],
  GIG: ["리우", "리우데자네이루", "rio de janeiro"],
  KIX: ["오사카", "간사이"],
  ITM: ["오사카"],
  SVO: ["모스크바"],
  DME: ["모스크바"],
  VKO: ["모스크바"],
  PVG: ["상하이", "푸동"],
  SHA: ["상하이", "훙차오"],
  PEK: ["베이징", "북경"],
  PKX: ["베이징", "다싱"],
  CDG: ["파리"],
  ORY: ["파리"],
  LHR: ["런던"],
  LGW: ["런던"],
  STN: ["런던"],
  LTN: ["런던"],
  EWR: ["뉴어크", "뉴욕"],
  JFK: ["뉴욕"],
  LGA: ["뉴욕"],
  IAD: ["워싱턴"],
  DCA: ["워싱턴"],
  HNL: ["호놀룰루", "하와이"],
};

// 도시명 정규화 — OurAirports의 "Shanghai (Pudong)", "Kuta, Badung",
// "Sydney (Mascot)" 같은 부가 표기를 떼어 KO_CITY_ALIASES 키와 매칭 가능하게 한다.
function normalizeCityKey(city: string): string {
  return city
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, "")
    .replace(/,.*$/, "")
    .trim();
}

// 검색용 사전계산 키 — 공항 1개당 한 줄로 모든 검색 가능 토큰을 이어 둔다.
type SearchableAirport = Airport & { searchKey: string };

const SEARCHABLE: SearchableAirport[] = ALL_AIRPORTS.map((a) => {
  const cityKey = normalizeCityKey(a.city);
  const cityAliases = KO_CITY_ALIASES[cityKey] ?? [];
  const iataAliases = IATA_ALIASES[a.iata] ?? [];
  const searchKey = [
    a.iata,
    a.name,
    a.city,
    a.country,
    ...cityAliases,
    ...iataAliases,
  ]
    .join(" ")
    .toLowerCase();
  return { ...a, searchKey };
});

export function searchAirports(query: string, limit = 30): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // IATA 정확 일치는 항상 1순위로 끌어올린다 (예: "icn" 입력 시 ICN 먼저).
  const out: SearchableAirport[] = [];
  const seen = new Set<string>();

  const exact = BY_IATA.get(q.toUpperCase());
  if (exact) {
    const promoted = SEARCHABLE.find((a) => a.iata === exact.iata);
    if (promoted) {
      out.push(promoted);
      seen.add(promoted.iata);
    }
  }

  for (const a of SEARCHABLE) {
    if (out.length >= limit) break;
    if (seen.has(a.iata)) continue;
    if (a.searchKey.includes(q)) {
      out.push(a);
      seen.add(a.iata);
    }
  }
  return out;
}
