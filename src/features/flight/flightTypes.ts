import type { Airport } from "./airports";

// 비행 상태에 저장되는 공항 참조. Airport와 같은 모양.
export type AirportRef = Airport;

export type ActiveFlight = {
  id: string;
  origin: AirportRef;
  destination: AirportRef;
  departAt: number; // ms epoch (폰 로컬 기준)
  arriveAt: number; // ms epoch
};
