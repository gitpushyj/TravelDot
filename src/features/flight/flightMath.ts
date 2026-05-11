// 비행 시각화에 필요한 구면/평면 좌표 계산 모음.
// 모든 lat/lng는 도(degree). 내부 계산은 라디안으로 변환해 처리한다.
// equirectangular 변환은 도트지도(viewBoxW=360, viewBoxH=maxLat-minLat) 좌표계와 일치한다.

const EARTH_RADIUS_KM = 6371.0088;

export function toRad(deg: number): number {
  "worklet";
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  "worklet";
  return (rad * 180) / Math.PI;
}

// 두 지점 사이의 대권거리(km). 평균 비행시간 추정에 사용.
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// 두 좌표를 단위 구면벡터로 변환 후 spherical linear interpolation(slerp)으로 보간.
// t=0이면 출발지, t=1이면 도착지. 반환은 도(degree).
// 일반 선형보간은 적도에서는 비슷하지만 위도가 높거나 양 좌표가 멀면 부정확하다.
// worklet 마커가 있어 Reanimated UI 스레드에서 매 프레임 호출해도 안전하다.
export function greatCircleInterp(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  t: number
): { lat: number; lng: number } {
  "worklet";
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lng1 * Math.PI) / 180;
  const λ2 = (lng2 * Math.PI) / 180;

  const x1 = Math.cos(φ1) * Math.cos(λ1);
  const y1 = Math.cos(φ1) * Math.sin(λ1);
  const z1 = Math.sin(φ1);
  const x2 = Math.cos(φ2) * Math.cos(λ2);
  const y2 = Math.cos(φ2) * Math.sin(λ2);
  const z2 = Math.sin(φ2);

  const dot = Math.max(-1, Math.min(1, x1 * x2 + y1 * y2 + z1 * z2));
  const ω = Math.acos(dot);

  // 두 점이 거의 같은 위치이면 ω≈0 → sin(ω)=0이 되어 0으로 나누는 사고가 난다.
  // 이때는 그냥 출발지를 반환해도 시각적으로 동일하다.
  if (ω < 1e-6) {
    return { lat: lat1, lng: lng1 };
  }

  const sinω = Math.sin(ω);
  const a = Math.sin((1 - t) * ω) / sinω;
  const b = Math.sin(t * ω) / sinω;
  const x = a * x1 + b * x2;
  const y = a * y1 + b * y2;
  const z = a * z1 + b * z2;

  const lat = (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI;
  const lng = (Math.atan2(y, x) * 180) / Math.PI;
  return { lat, lng };
}

// 출발지에서 도착지를 바라본 초기 방위각(true bearing). 북쪽=0°, 시계방향.
// 비행기 픽셀의 회전 각도 계산에 사용. 출발 시 한 번 계산해 고정 사용.
export function initialBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

// 도트지도 좌표계로의 변환. 도트지도는 equirectangular projection으로
// x = (lng + 180) * baseScale, y = (maxLat - lat) * baseScale 형태. (DotMap.tsx와 동일)
// FlightOverlay에서 비행기 위치/경로 점을 그릴 때 이 함수를 통과시킨다.
export function lngToX(lng: number, baseScale: number): number {
  "worklet";
  return (lng + 180) * baseScale;
}

export function latToY(lat: number, maxLat: number, baseScale: number): number {
  "worklet";
  return (maxLat - lat) * baseScale;
}

// 대권 경로를 균등한 t로 N개 점으로 샘플링. 경로 점선을 미리 계산해 두는 용도.
// JS 스레드에서 한 번만 호출 (비행 시작 시점). worklet 아님.
export function sampleGreatCircle(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  count: number
): { lat: number; lng: number }[] {
  const pts: { lat: number; lng: number }[] = [];
  if (count <= 1) {
    pts.push({ lat: lat1, lng: lng1 });
    return pts;
  }
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    pts.push(greatCircleInterp(lat1, lng1, lat2, lng2, t));
  }
  return pts;
}
