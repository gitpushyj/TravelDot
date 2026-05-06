import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, MultiPolygon, Polygon } from "geojson";

import countriesData from "../../../assets/data/countries-polygons.json";

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

export function resolveCountry(lat: number, lng: number): string | null {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }
  const pt = point([lng, lat]);
  for (let i = 0; i < features.length; i++) {
    const [minX, minY, maxX, maxY] = boxes[i];
    if (lng < minX || lng > maxX || lat < minY || lat > maxY) continue;
    if (booleanPointInPolygon(pt, features[i])) {
      return features[i].properties.code;
    }
  }
  return null;
}
