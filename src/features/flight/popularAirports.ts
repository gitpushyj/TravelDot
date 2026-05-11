// 검색어가 비어 있을 때 AirportPicker에 보여 줄 추천 공항 IATA 코드.
// ACI World 2023 통계 기준.
//
// 출발(origin) 추천 — 전체 승객 교통량(passenger throughput) top 10. 가장 큰 hub
// airports로, 출발 편이 가장 많은 공항들이다.
// 도착(destination) 추천 — 국제선 승객 교통량(international passenger traffic) top 10.
// 국제선 도착이 가장 많은 공항들로, 출발 hub와는 약간 다른 라인업이 된다(예: ICN/AMS/HKG).
//
// 코드는 모두 dataset(assets/data/airports.json)에 존재해야 한다(확인 완료).
export const POPULAR_DEPARTURE_IATAS: readonly string[] = [
  "ATL",
  "DXB",
  "DFW",
  "LHR",
  "HND",
  "DEN",
  "IST",
  "LAX",
  "ORD",
  "CDG",
];

export const POPULAR_ARRIVAL_IATAS: readonly string[] = [
  "DXB",
  "LHR",
  "AMS",
  "HKG",
  "ICN",
  "CDG",
  "IST",
  "SIN",
  "FRA",
  "DOH",
];
