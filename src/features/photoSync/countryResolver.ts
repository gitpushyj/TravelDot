import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, MultiPolygon, Polygon } from "geojson";

import countriesData from "../../../assets/data/countries-polygons.json";

// 자치령/해외영토를 부모 국가로 흡수해 컬렉션 완성 동기를 해치지 않도록 한다.
// resolve 후처리만 적용하며 폴리곤은 그대로 둔다 (좌표 매칭은 정확한 폴리곤이 필요).
const TERRITORY_TO_PARENT: Record<string, string> = {
  JE: "GB",
  GG: "GB",
  IM: "GB",
  KY: "GB",
  BL: "FR",
  MF: "FR",
};

function applyTerritoryMapping(code: string): string {
  return TERRITORY_TO_PARENT[code] ?? code;
}

type CountryFeature = Feature<Polygon | MultiPolygon, { code: string }>;

const features = (
  countriesData as { features: CountryFeature[] }
).features;

type Box = [number, number, number, number]; // [minX, minY, maxX, maxY]

function bboxOf(f: CountryFeature): Box {
  let minX = 180;
  let minY = 90;
  let maxX = -180;
  let maxY = -90;
  const visit = (ring: number[][]) => {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  };
  const g = f.geometry;
  if (g.type === "Polygon") {
    for (const r of g.coordinates) visit(r);
  } else {
    for (const poly of g.coordinates) {
      for (const r of poly) visit(r);
    }
  }
  return [minX, minY, maxX, maxY];
}

const boxes: Box[] = features.map(bboxOf);

const codeToIndex: Map<string, number> = new Map(
  features.map((f, i) => [f.properties.code, i])
);

// 본국 polygon에 들어오는 점은 ray-cast 1회로 즉시 본국 처리한다. 10만 장
// 스캔에서 90%+를 차지하는 본국 사진은 전체 features 루프를 도는 대신 polygon
// 1회만 검사하면 끝난다. bbox-only 단축은 사각형이 polygon의 superset이라
// 본국 외 사진을 본국으로 잘못 분류할 수 있어 사용하지 않는다 (예: KR bbox는
// 후쿠오카·키타큐슈·쓰시마를 포함).
export function isInsideCountryPolygon(
  code: string,
  lat: number,
  lng: number
): boolean {
  const i = codeToIndex.get(code);
  if (i == null) return false;
  const [minX, minY, maxX, maxY] = boxes[i];
  if (lng < minX || lng > maxX || lat < minY || lat > maxY) return false;
  return booleanPointInPolygon(point([lng, lat]), features[i]);
}

export type ResolveDiagnostics = {
  bboxHits: number;
  totalFeatures: number;
};

export function resolveCountryDetailed(
  lat: number,
  lng: number
): { code: string | null; diag: ResolveDiagnostics } {
  const diag: ResolveDiagnostics = {
    bboxHits: 0,
    totalFeatures: features.length,
  };
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return { code: null, diag };
  }
  const pt = point([lng, lat]);
  for (let i = 0; i < features.length; i++) {
    const [minX, minY, maxX, maxY] = boxes[i];
    if (lng < minX || lng > maxX || lat < minY || lat > maxY) continue;
    diag.bboxHits += 1;
    if (booleanPointInPolygon(pt, features[i])) {
      return { code: applyTerritoryMapping(features[i].properties.code), diag };
    }
  }
  return { code: null, diag };
}

export function resolveCountry(lat: number, lng: number): string | null {
  return resolveCountryDetailed(lat, lng).code;
}
