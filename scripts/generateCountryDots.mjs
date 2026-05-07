// CountryDotMap의 per-country 도트를 빌드 타임에 미리 계산한다.
// CountryDotMap.tsx의 generateDots / removeFarOutliers 로직을 그대로 옮겨 와
// 시각적 결과가 동일하도록 한다.
//
// 입력:  assets/data/countries-polygons.json
// 출력:  assets/data/country-dots.json  (코드별 [lng, lat, lng, lat, ...])
//
// Usage: node scripts/generateCountryDots.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GRID_SIZE = 1; // CountryDotMap.tsx와 동일

const inPath = path.join(
  __dirname,
  "..",
  "assets",
  "data",
  "countries-polygons.json"
);
const outDir = path.join(__dirname, "..", "assets", "data");
const outPath = path.join(outDir, "country-dots.json");

const data = JSON.parse(fs.readFileSync(inPath, "utf8"));
const FEATURES = data.features;

const codes = new Set();
for (const f of FEATURES) codes.add(f.properties.code);

function generateDots(countryCode) {
  const matched = FEATURES.filter((f) => f.properties.code === countryCode);
  if (matched.length === 0) return [];
  let minLng = 180;
  let maxLng = -180;
  let minLat = 90;
  let maxLat = -90;
  const visit = (ring) => {
    for (const [x, y] of ring) {
      if (x < minLng) minLng = x;
      if (x > maxLng) maxLng = x;
      if (y < minLat) minLat = y;
      if (y > maxLat) maxLat = y;
    }
  };
  for (const f of matched) {
    const g = f.geometry;
    if (g.type === "Polygon") {
      for (const r of g.coordinates) visit(r);
    } else {
      for (const poly of g.coordinates) for (const r of poly) visit(r);
    }
  }
  const startLat = Math.floor(minLat / GRID_SIZE) * GRID_SIZE;
  const startLng = Math.floor(minLng / GRID_SIZE) * GRID_SIZE;
  const dots = [];
  for (let lat = startLat; lat <= maxLat; lat += GRID_SIZE) {
    for (let lng = startLng; lng <= maxLng; lng += GRID_SIZE) {
      const cellLat = lat + GRID_SIZE / 2;
      const cellLng = lng + GRID_SIZE / 2;
      const pt = point([cellLng, cellLat]);
      for (const f of matched) {
        if (booleanPointInPolygon(pt, f)) {
          dots.push({ lat: cellLat, lng: cellLng });
          break;
        }
      }
    }
  }
  return removeFarOutliers(dots);
}

function removeFarOutliers(points) {
  if (points.length < 8) return points;
  const lats = points.map((p) => p.lat).sort((a, b) => a - b);
  const lngs = points.map((p) => p.lng).sort((a, b) => a - b);
  const cLat = lats[Math.floor(lats.length / 2)];
  const cLng = lngs[Math.floor(lngs.length / 2)];
  const dists = points.map((p) => {
    const dx = p.lng - cLng;
    const dy = p.lat - cLat;
    return Math.sqrt(dx * dx + dy * dy);
  });
  const sortedDists = [...dists].sort((a, b) => a - b);
  const q1 = sortedDists[Math.floor(sortedDists.length * 0.25)];
  const q3 = sortedDists[Math.floor(sortedDists.length * 0.75)];
  const iqr = q3 - q1;
  const upper = q3 + 1.5 * iqr;
  const filtered = points.filter((_, i) => dists[i] <= upper);
  return filtered.length >= Math.max(4, Math.floor(points.length * 0.5))
    ? filtered
    : points;
}

const out = {};
let totalDots = 0;
const sortedCodes = [...codes].sort();
for (const code of sortedCodes) {
  const dots = generateDots(code);
  // [lng, lat, lng, lat, ...] 평면 배열로 압축 (JSON 크기 최소화).
  const flat = new Array(dots.length * 2);
  for (let i = 0; i < dots.length; i++) {
    flat[i * 2] = +dots[i].lng.toFixed(2);
    flat[i * 2 + 1] = +dots[i].lat.toFixed(2);
  }
  out[code] = flat;
  totalDots += dots.length;
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out));

const stat = fs.statSync(outPath);
console.log(`countries: ${sortedCodes.length}`);
console.log(`total dots: ${totalDots}`);
console.log(`-> ${path.relative(process.cwd(), outPath)} (${(stat.size / 1024).toFixed(1)} KB)`);
