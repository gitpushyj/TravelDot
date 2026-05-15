// 본국으로 설정 가능한 국가들의 수도 좌표 ([lat, lng] 순).
// 인트로 줌아웃 애니메이션의 시작 중심점으로 사용된다.
// dots.json에 포함된 모든 ISO Alpha-2 코드(204개)를 커버한다.
// 불가피하게 누락된 국가는 본국 도트 좌표의 median으로 fallback 처리됨.
export const COUNTRY_CAPITALS: Record<string, readonly [number, number]> = {
  AD: [42.51, 1.52], // Andorra la Vella
  AE: [24.45, 54.38], // Abu Dhabi
  AF: [34.53, 69.17], // Kabul
  AG: [17.12, -61.85], // St. John's
  AL: [41.33, 19.82], // Tirana
  AM: [40.18, 44.51], // Yerevan
  AO: [-8.84, 13.23], // Luanda
  AR: [-34.61, -58.38], // Buenos Aires
  AT: [48.21, 16.37], // Vienna
  AU: [-35.28, 149.13], // Canberra
  AW: [12.52, -70.03], // Oranjestad
  AX: [60.10, 19.93], // Mariehamn (Åland)
  AZ: [40.41, 49.87], // Baku
  BA: [43.86, 18.41], // Sarajevo
  BB: [13.10, -59.62], // Bridgetown
  BD: [23.81, 90.41], // Dhaka
  BE: [50.85, 4.35], // Brussels
  BF: [12.37, -1.52], // Ouagadougou
  BG: [42.70, 23.32], // Sofia
  BH: [26.23, 50.59], // Manama
  BI: [-3.43, 29.93], // Gitega
  BJ: [6.50, 2.62], // Porto-Novo
  BN: [4.90, 114.94], // Bandar Seri Begawan
  BO: [-16.50, -68.15], // La Paz (행정수도, 인구 밀도 더 높음)
  BR: [-15.79, -47.88], // Brasília
  BS: [25.05, -77.36], // Nassau
  BT: [27.47, 89.64], // Thimphu
  BW: [-24.65, 25.91], // Gaborone
  BY: [53.90, 27.57], // Minsk
  BZ: [17.25, -88.77], // Belmopan
  CA: [45.42, -75.69], // Ottawa
  CD: [-4.32, 15.32], // Kinshasa
  CF: [4.36, 18.55], // Bangui
  CG: [-4.27, 15.27], // Brazzaville
  CH: [46.95, 7.45], // Bern
  CI: [6.83, -5.28], // Yamoussoukro
  CK: [-21.21, -159.78], // Avarua
  CL: [-33.45, -70.65], // Santiago
  CM: [3.87, 11.52], // Yaoundé
  CN: [39.90, 116.41], // Beijing
  CO: [4.71, -74.07], // Bogotá
  CR: [9.93, -84.08], // San José
  CU: [23.13, -82.38], // Havana
  CV: [14.93, -23.51], // Praia
  CW: [12.12, -68.93], // Willemstad
  CZ: [50.08, 14.44], // Prague
  DE: [52.52, 13.41], // Berlin
  DJ: [11.59, 43.15], // Djibouti
  DK: [55.68, 12.57], // Copenhagen
  DO: [18.49, -69.93], // Santo Domingo
  DZ: [36.75, 3.06], // Algiers
  EC: [-0.18, -78.47], // Quito
  EE: [59.44, 24.75], // Tallinn
  EG: [30.05, 31.25], // Cairo
  EH: [27.15, -13.20], // El Aaiún (서사하라)
  ER: [15.32, 38.93], // Asmara
  ES: [40.42, -3.70], // Madrid
  ET: [9.03, 38.74], // Addis Ababa
  FI: [60.17, 24.94], // Helsinki
  FJ: [-18.14, 178.44], // Suva
  FM: [6.92, 158.16], // Palikir
  FO: [62.01, -6.77], // Tórshavn (페로 제도)
  FR: [48.85, 2.35], // Paris
  GA: [0.42, 9.45], // Libreville
  GB: [51.51, -0.13], // London
  GE: [41.72, 44.78], // Tbilisi
  GH: [5.60, -0.19], // Accra
  GL: [64.18, -51.74], // Nuuk
  GN: [9.51, -13.71], // Conakry
  GQ: [3.75, 8.78], // Malabo
  GR: [37.98, 23.73], // Athens
  GT: [14.63, -90.51], // Guatemala City
  GW: [11.86, -15.58], // Bissau
  GY: [6.80, -58.16], // Georgetown
  HN: [14.07, -87.19], // Tegucigalpa
  HR: [45.81, 15.98], // Zagreb
  HT: [18.59, -72.31], // Port-au-Prince
  HU: [47.50, 19.04], // Budapest
  ID: [-6.21, 106.85], // Jakarta
  IE: [53.35, -6.26], // Dublin
  IL: [31.78, 35.22], // Jerusalem
  IN: [28.61, 77.21], // New Delhi
  IQ: [33.32, 44.36], // Baghdad
  IR: [35.69, 51.39], // Tehran
  IS: [64.15, -21.94], // Reykjavik
  IT: [41.90, 12.50], // Rome
  JM: [17.97, -76.79], // Kingston
  JO: [31.95, 35.93], // Amman
  JP: [35.68, 139.69], // Tokyo
  KE: [-1.29, 36.82], // Nairobi
  KG: [42.87, 74.59], // Bishkek
  KH: [11.55, 104.92], // Phnom Penh
  KI: [1.45, 173.04], // Tarawa
  KM: [-11.70, 43.26], // Moroni (코모로)
  KP: [39.02, 125.76], // Pyongyang
  KR: [37.57, 126.98], // Seoul
  KW: [29.38, 47.99], // Kuwait City
  KZ: [51.17, 71.42], // Astana
  LA: [17.97, 102.60], // Vientiane
  LB: [33.89, 35.50], // Beirut
  LC: [14.01, -60.99], // Castries
  LI: [47.14, 9.52], // Vaduz
  LK: [6.93, 79.86], // Sri Jayawardenepura Kotte / Colombo
  LR: [6.30, -10.80], // Monrovia
  LS: [-29.31, 27.49], // Maseru
  LT: [54.69, 25.28], // Vilnius
  LU: [49.61, 6.13], // Luxembourg
  LV: [56.95, 24.11], // Riga
  LY: [32.89, 13.18], // Tripoli
  MA: [34.02, -6.83], // Rabat
  MC: [43.74, 7.42], // Monaco
  MD: [47.01, 28.86], // Chișinău
  ME: [42.44, 19.26], // Podgorica
  MG: [-18.88, 47.51], // Antananarivo
  MH: [7.09, 171.39], // Majuro
  MK: [41.99, 21.43], // Skopje
  ML: [12.65, -8.00], // Bamako
  MM: [19.76, 96.08], // Naypyidaw
  MN: [47.92, 106.92], // Ulaanbaatar
  MO: [22.20, 113.55], // Macau
  MR: [18.08, -15.98], // Nouakchott
  MT: [35.90, 14.51], // Valletta
  MU: [-20.16, 57.50], // Port Louis
  MV: [4.18, 73.51], // Malé
  MW: [-13.96, 33.79], // Lilongwe
  MX: [19.43, -99.13], // Mexico City
  MY: [3.14, 101.69], // Kuala Lumpur
  MZ: [-25.97, 32.58], // Maputo
  NA: [-22.57, 17.08], // Windhoek
  NE: [13.51, 2.10], // Niamey
  NG: [9.06, 7.50], // Abuja
  NI: [12.11, -86.25], // Managua
  NL: [52.37, 4.90], // Amsterdam
  NO: [59.91, 10.75], // Oslo
  NP: [27.71, 85.32], // Kathmandu
  NR: [-0.55, 166.92], // Yaren
  NU: [-19.05, -169.92], // Alofi
  NZ: [-41.29, 174.78], // Wellington
  OM: [23.59, 58.41], // Muscat
  PA: [8.98, -79.52], // Panama City
  PE: [-12.05, -77.04], // Lima
  PG: [-9.44, 147.18], // Port Moresby
  PH: [14.60, 120.98], // Manila
  PK: [33.69, 73.05], // Islamabad
  PL: [52.23, 21.01], // Warsaw
  PS: [31.90, 35.20], // Ramallah (팔레스타인)
  PT: [38.72, -9.14], // Lisbon
  PW: [7.50, 134.62], // Ngerulmud
  PY: [-25.27, -57.58], // Asunción
  QA: [25.29, 51.53], // Doha
  RO: [44.43, 26.10], // Bucharest
  RS: [44.79, 20.45], // Belgrade
  RU: [55.75, 37.62], // Moscow
  RW: [-1.94, 30.06], // Kigali
  SA: [24.71, 46.68], // Riyadh
  SB: [-9.43, 159.96], // Honiara
  SC: [-4.62, 55.45], // Victoria
  SD: [15.50, 32.56], // Khartoum
  SE: [59.33, 18.07], // Stockholm
  SG: [1.35, 103.82], // Singapore
  SI: [46.06, 14.51], // Ljubljana
  SK: [48.15, 17.11], // Bratislava
  SL: [8.48, -13.23], // Freetown
  SM: [43.94, 12.45], // San Marino
  SN: [14.69, -17.45], // Dakar
  SO: [2.05, 45.32], // Mogadishu
  SR: [5.85, -55.20], // Paramaribo
  SS: [4.86, 31.57], // Juba (남수단)
  ST: [0.34, 6.73], // São Tomé
  SV: [13.69, -89.19], // San Salvador
  SY: [33.51, 36.29], // Damascus
  SZ: [-26.32, 31.13], // Mbabane (에스와티니)
  TD: [12.13, 15.06], // N'Djamena
  TG: [6.13, 1.21], // Lomé
  TH: [13.75, 100.50], // Bangkok
  TJ: [38.56, 68.79], // Dushanbe
  TL: [-8.55, 125.58], // Dili (동티모르)
  TM: [37.96, 58.33], // Ashgabat
  TN: [36.81, 10.18], // Tunis
  TO: [-21.13, -175.21], // Nuku'alofa
  TR: [39.93, 32.87], // Ankara
  TT: [10.66, -61.51], // Port of Spain
  TV: [-8.52, 179.20], // Funafuti
  TW: [25.03, 121.57], // Taipei
  TZ: [-6.16, 35.75], // Dodoma
  UA: [50.45, 30.52], // Kyiv
  UG: [0.32, 32.58], // Kampala
  US: [38.91, -77.04], // Washington, D.C.
  UY: [-34.91, -56.18], // Montevideo
  UZ: [41.30, 69.24], // Tashkent
  VA: [41.90, 12.45], // Vatican City
  VC: [13.16, -61.22], // Kingstown
  VE: [10.50, -66.92], // Caracas
  VN: [21.03, 105.85], // Hanoi
  VU: [-17.73, 168.32], // Port Vila
  WS: [-13.83, -171.77], // Apia
  XK: [42.67, 21.17], // Pristina (코소보)
  YE: [15.35, 44.21], // Sana'a
  ZA: [-25.75, 28.19], // Pretoria (행정수도)
  ZM: [-15.42, 28.28], // Lusaka
  ZW: [-17.83, 31.05], // Harare
};
