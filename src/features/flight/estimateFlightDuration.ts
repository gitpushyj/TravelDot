import { haversineKm } from "./flightMath";

// 평균 순항속도. 보잉/에어버스 단·중·장거리 평균을 단순화한 값.
const CRUISE_KMH = 800;

// 이착륙·택싱·상승·강하 보정. 단거리/장거리 무관하게 평균 ~30분 적용.
const GROUND_BUFFER_MIN = 30;

// 두 공항 좌표로부터 평균 비행시간(분) 추정.
// 사용자가 도착시각을 수동 수정할 수 있으므로 정확도는 ±15분 수준이면 충분.
export function estimateFlightMinutes(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): number {
  const distanceKm = haversineKm(originLat, originLng, destLat, destLng);
  const cruiseMinutes = (distanceKm / CRUISE_KMH) * 60;
  return Math.round(cruiseMinutes + GROUND_BUFFER_MIN);
}
