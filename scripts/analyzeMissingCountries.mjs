// Find countries that the current dots.json fails to cover.
// Usage: node scripts/analyzeMissingCountries.mjs [--countries 50m|110m]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const which = args.includes("--countries")
  ? args[args.indexOf("--countries") + 1]
  : "50m";

const countriesPath = path.join(
  __dirname,
  which === "50m" ? "ne_50m_countries.geojson" : "ne_110m_countries.geojson"
);
const dotsPath = path.join(__dirname, "..", "assets", "data", "dots.json");

const countries = JSON.parse(fs.readFileSync(countriesPath, "utf8"));
const dotData = JSON.parse(fs.readFileSync(dotsPath, "utf8"));

function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function pointInPolygon(p, polygon) {
  if (!pointInRing(p, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++)
    if (pointInRing(p, polygon[i])) return false;
  return true;
}
function pointInFeature(p, f) {
  const g = f.geometry;
  if (!g) return false;
  if (g.type === "Polygon") return pointInPolygon(p, g.coordinates);
  if (g.type === "MultiPolygon")
    return g.coordinates.some((poly) => pointInPolygon(p, poly));
  return false;
}

// Quick bbox prefilter to speed up.
function bboxOfFeature(f) {
  const g = f.geometry;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const visit = (poly) => {
    for (const ring of poly)
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  };
  if (g.type === "Polygon") visit(g.coordinates);
  else if (g.type === "MultiPolygon") g.coordinates.forEach(visit);
  return [minX, minY, maxX, maxY];
}

const results = [];
for (const f of countries.features) {
  const name = f.properties.NAME || f.properties.NAME_LONG || "?";
  const code = f.properties.ISO_A2_EH || f.properties.ISO_A2 || "??";
  const [minX, minY, maxX, maxY] = bboxOfFeature(f);
  const widthDeg = maxX - minX;
  const heightDeg = maxY - minY;

  let count = 0;
  for (const d of dotData.dots) {
    if (d.lng < minX || d.lng > maxX || d.lat < minY || d.lat > maxY) continue;
    if (pointInFeature([d.lng, d.lat], f)) count++;
  }
  results.push({ name, code, dots: count, widthDeg, heightDeg });
}

const total = results.length;
const missing = results
  .filter((r) => r.dots === 0)
  .sort((a, b) => b.widthDeg * b.heightDeg - a.widthDeg * a.heightDeg);
const tiny = missing.filter((r) => r.widthDeg < 2 && r.heightDeg < 2);
const small = missing.filter((r) => !tiny.includes(r));

console.log(
  `[${which}] gridSize=${dotData.gridSize}°  countries=${total}  missing=${missing.length}  (tiny=${tiny.length}, larger=${small.length})\n`
);
console.log("[누락 — 격자보다 큰 영역인데 점이 안 떨어진 케이스]");
console.table(
  small.map((r) => ({
    name: r.name,
    code: r.code,
    "w(°)": r.widthDeg.toFixed(2),
    "h(°)": r.heightDeg.toFixed(2),
  }))
);
console.log("\n[누락 — 마이크로스테이트/소도서국]");
console.table(
  tiny.map((r) => ({
    name: r.name,
    code: r.code,
    "w(°)": r.widthDeg.toFixed(2),
    "h(°)": r.heightDeg.toFixed(2),
  }))
);
