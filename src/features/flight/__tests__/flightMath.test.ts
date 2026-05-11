import {
  greatCircleInterp,
  haversineKm,
  initialBearing,
  sampleGreatCircle,
} from "../flightMath";

describe("flightMath", () => {
  // 잘 알려진 거리. ICN(인천) → NRT(나리타) ≈ 1240km.
  it("haversineKm calculates ICN→NRT distance", () => {
    const d = haversineKm(37.4691, 126.4505, 35.772, 140.3929);
    expect(d).toBeGreaterThan(1200);
    expect(d).toBeLessThan(1280);
  });

  // JFK(뉴욕) → LAX(LA) ≈ 3970km
  it("haversineKm calculates JFK→LAX distance", () => {
    const d = haversineKm(40.6413, -73.7781, 33.9425, -118.4081);
    expect(d).toBeGreaterThan(3900);
    expect(d).toBeLessThan(4050);
  });

  // 두 같은 좌표면 거리 0.
  it("haversineKm of same point is 0", () => {
    expect(haversineKm(10, 10, 10, 10)).toBeCloseTo(0, 5);
  });

  // slerp t=0이면 출발지, t=1이면 도착지.
  it("greatCircleInterp returns endpoints at t=0 and t=1", () => {
    const p0 = greatCircleInterp(37.5, 127, 35.7, 140.4, 0);
    expect(p0.lat).toBeCloseTo(37.5, 4);
    expect(p0.lng).toBeCloseTo(127, 4);

    const p1 = greatCircleInterp(37.5, 127, 35.7, 140.4, 1);
    expect(p1.lat).toBeCloseTo(35.7, 4);
    expect(p1.lng).toBeCloseTo(140.4, 4);
  });

  // 적도 근처 두 점은 slerp 중간이 위경도 단순 평균과 거의 일치(직선 근사).
  it("greatCircleInterp midpoint near equator approximates linear", () => {
    const mid = greatCircleInterp(0, 0, 0, 20, 0.5);
    expect(mid.lat).toBeCloseTo(0, 4);
    expect(mid.lng).toBeCloseTo(10, 2);
  });

  // initialBearing: 같은 경도에서 북쪽으로 가면 0°.
  it("initialBearing due north is 0", () => {
    const b = initialBearing(0, 0, 10, 0);
    expect(b).toBeCloseTo(0, 4);
  });

  // 같은 위도에서 동쪽으로 가면 90°.
  it("initialBearing due east is 90", () => {
    const b = initialBearing(0, 0, 0, 10);
    expect(b).toBeCloseTo(90, 1);
  });

  // sampleGreatCircle returns N points including endpoints.
  it("sampleGreatCircle returns endpoints + correct count", () => {
    const pts = sampleGreatCircle(0, 0, 0, 20, 5);
    expect(pts).toHaveLength(5);
    expect(pts[0].lng).toBeCloseTo(0, 4);
    expect(pts[4].lng).toBeCloseTo(20, 2);
  });

  // 동일점 입력에 0 division 가드.
  it("greatCircleInterp handles identical points", () => {
    const p = greatCircleInterp(45, 45, 45, 45, 0.5);
    expect(p.lat).toBe(45);
    expect(p.lng).toBe(45);
  });
});
