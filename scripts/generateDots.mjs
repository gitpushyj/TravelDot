// Generate world land dots from Natural Earth GeoJSON.
// Output: assets/data/dots.json
//
// Two-pass strategy (all dots are snapped to the lat/lng grid so the result
// looks like a clean dot matrix, no rogue offset points):
//
//   1) Lat/lng grid over ne_50m_land — covers continents and most named
//      islands at this resolution.
//
//   2) For each country in ne_50m_admin_0_countries that ended up with ZERO
//      grid dots, find the grid cell containing the country's LABEL_X/LABEL_Y
//      and add a dot at that cell's CENTER (so it stays grid-aligned). If
//      that cell is already a grid dot, the country is implicitly grouped
//      into the neighboring cell — no duplicate dot is added.
//
// Usage:
//   node scripts/generateDots.mjs                (default: --grid 2)
//   node scripts/generateDots.mjs --grid 2.5
//   node scripts/generateDots.mjs --no-anchors

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

function readArg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 ? parseFloat(args[i + 1]) : fallback;
}
const hasFlag = (flag) => args.includes(flag);

const gridSize = readArg("--grid", 2);
const minLat = readArg("--min-lat", -60);
const maxLat = readArg("--max-lat", 85);
const includeAnchors = !hasFlag("--no-anchors");

const land = JSON.parse(
  fs.readFileSync(path.join(__dirname, "ne_50m_land.geojson"), "utf8")
);
const countries = includeAnchors
  ? JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "ne_50m_countries.geojson"),
        "utf8"
      )
    )
  : null;

const outDir = path.join(__dirname, "..", "assets", "data");
const outPath = path.join(outDir, "dots.json");

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

function isLand(lng, lat) {
  for (const f of land.features) if (pointInFeature([lng, lat], f)) return true;
  return false;
}

// Cache country bboxes / codes for fast lookup during pass 1.
const countryBoxes = (countries?.features || []).map((f) => {
  const props = f.properties || {};
  let code;
  if (props.ISO_A2_EH && props.ISO_A2_EH !== "-99") code = props.ISO_A2_EH;
  else if (props.ISO_A2 && props.ISO_A2 !== "-99") code = props.ISO_A2;
  return {
    feature: f,
    bbox: bboxOfFeature(f),
    code,
    name: props.NAME,
  };
});

function findCountry(lng, lat) {
  for (const c of countryBoxes) {
    const [bx0, by0, bx1, by1] = c.bbox;
    if (lng < bx0 || lng > bx1 || lat < by0 || lat > by1) continue;
    if (pointInFeature([lng, lat], c.feature)) return c;
  }
  return null;
}

// 한 격자 셀(gridSize×gridSize) 안을 5×5로 샘플링해 영토가 걸치는 모든 국가를 모은다.
function findCountriesInCell(lat, lng, gridSize) {
  const samples = 5;
  const step = gridSize / samples;
  const start = -gridSize / 2 + step / 2;
  const seen = new Map();
  const order = [];
  for (let i = 0; i < samples; i++) {
    for (let j = 0; j < samples; j++) {
      const sLat = lat + start + i * step;
      const sLng = lng + start + j * step;
      const c = findCountry(sLng, sLat);
      if (c && c.code && !seen.has(c.code)) {
        seen.set(c.code, c.name);
        order.push(c.code);
      }
    }
  }
  return order.map((code) => ({ code, name: seen.get(code) }));
}

const half = gridSize / 2;

// Snap an arbitrary lat/lng to its grid-cell center (matches the cell layout
// produced by pass 1).
function snapToCell(lat, lng) {
  return {
    lat: Math.floor(lat / gridSize) * gridSize + half,
    lng: Math.floor(lng / gridSize) * gridSize + half,
  };
}

function cellKey(lat, lng) {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

// ---- Pass 1: lat/lng grid over land ----
const dots = [];
const occupied = new Set();
let nextId = 0;

const startLat = Math.ceil((minLat - half) / gridSize) * gridSize + half;
for (let lat = startLat; lat <= maxLat - half + 1e-9; lat += gridSize) {
  for (let lng = -180 + half; lng < 180; lng += gridSize) {
    if (isLand(lng, lat)) {
      const dot = {
        id: `g${nextId++}`,
        lat: +lat.toFixed(2),
        lng: +lng.toFixed(2),
        kind: "grid",
      };
      const c = findCountry(lng, lat);
      if (c) {
        if (c.code) dot.country = c.code;
        if (c.name) dot.name = c.name;
      }
      const cs = findCountriesInCell(lat, lng, gridSize);
      if (cs.length) dot.countries = cs;
      dots.push(dot);
      occupied.add(cellKey(dot.lat, dot.lng));
    }
  }
}

const gridCount = dots.length;

// ---- Pass 2: anchor (snapped) for each uncovered country ----
let anchorCount = 0;
const skippedAnchors = [];
const anchorsAddedFor = [];
const anchorsMergedFor = [];
if (countries) {
  for (const f of countries.features) {
    const props = f.properties || {};
    const labelX = props.LABEL_X;
    const labelY = props.LABEL_Y;
    if (typeof labelX !== "number" || typeof labelY !== "number") continue;
    if (labelY < minLat || labelY > maxLat) {
      skippedAnchors.push(props.NAME);
      continue;
    }

    // Already covered by any existing dot inside the country polygon?
    const [bx0, by0, bx1, by1] = bboxOfFeature(f);
    let covered = false;
    for (const d of dots) {
      if (d.lng < bx0 || d.lng > bx1 || d.lat < by0 || d.lat > by1) continue;
      if (pointInFeature([d.lng, d.lat], f)) {
        covered = true;
        break;
      }
    }
    if (covered) continue;

    // Snap label point to its grid cell.
    const snapped = snapToCell(labelY, labelX);
    const key = cellKey(snapped.lat, snapped.lng);

    // If that cell already has a dot (because it belongs to a neighboring
    // country at this resolution), don't duplicate — the country is grouped
    // into that shared cell.
    if (occupied.has(key)) {
      anchorsMergedFor.push(props.NAME);
      continue;
    }

    if (snapped.lat < minLat || snapped.lat > maxLat) {
      skippedAnchors.push(props.NAME);
      continue;
    }

    const code =
      props.ISO_A2_EH && props.ISO_A2_EH !== "-99"
        ? props.ISO_A2_EH
        : props.ISO_A2 || undefined;

    const cs = findCountriesInCell(snapped.lat, snapped.lng, gridSize);
    if (code && !cs.some((c) => c.code === code)) {
      cs.unshift({ code, name: props.NAME });
    }

    dots.push({
      id: `a${nextId++}`,
      lat: +snapped.lat.toFixed(2),
      lng: +snapped.lng.toFixed(2),
      kind: "anchor",
      country: code,
      name: props.NAME,
      countries: cs.length ? cs : undefined,
    });
    occupied.add(key);
    anchorCount++;
    anchorsAddedFor.push(props.NAME);
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      gridSize,
      minLat,
      maxLat,
      count: dots.length,
      gridCount,
      anchorCount,
      dots,
    },
    null,
    0
  )
);

console.log(`gridSize=${gridSize}°, lat=[${minLat}, ${maxLat}]`);
console.log(`  grid dots:   ${gridCount}`);
console.log(`  anchor dots: ${anchorCount}`);
console.log(`  total:       ${dots.length}`);
if (anchorsMergedFor.length) {
  console.log(
    `  merged into existing cell (no extra dot): ${anchorsMergedFor.join(", ")}`
  );
}
if (skippedAnchors.length) {
  console.log(`  skipped (out of lat range): ${skippedAnchors.join(", ")}`);
}
console.log(`-> ${path.relative(process.cwd(), outPath)}`);
