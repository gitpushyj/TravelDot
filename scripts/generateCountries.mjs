// Build assets/data/countries.json (alpha-2 + names) and
// assets/data/countries.geojson (normalized polygons with { code }) from
// scripts/ne_50m_countries.geojson.
//
// Territory overrides keep parity with scripts/generateDots.mjs so that
// runtime country resolution matches the dot map's country grouping.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = JSON.parse(
  fs.readFileSync(path.join(__dirname, "ne_50m_countries.geojson"), "utf8")
);

const TERRITORY_OVERRIDES = {
  TF: "FR",
  PF: "FR",
  NC: "FR",
  WF: "FR",
  PM: "FR",
  AI: "GB",
  BM: "GB",
  IO: "GB",
  VG: "GB",
  FK: "GB",
  GS: "GB",
  MS: "GB",
  PN: "GB",
  SH: "GB",
  TC: "GB",
  AS: "US",
  GU: "US",
  MP: "US",
  PR: "US",
  VI: "US",
  NF: "AU",
  HM: "AU",
};

function rawCode(p) {
  if (p.ISO_A2_EH && p.ISO_A2_EH !== "-99") return p.ISO_A2_EH;
  if (p.ISO_A2 && p.ISO_A2 !== "-99") return p.ISO_A2;
  return null;
}

const seen = new Map();
const features = [];
for (const f of src.features) {
  const p = f.properties || {};
  const original = rawCode(p);
  if (!original) continue;
  const code = TERRITORY_OVERRIDES[original] || original;
  features.push({
    type: "Feature",
    properties: { code },
    geometry: f.geometry,
  });
  // territory feature는 폴리곤 매핑에만 쓰고, 이름 목록은 sovereign 피처에서만 뽑는다.
  // 그래야 "MP가 먼저 나와서 US 슬롯을 '북마리아나' 이름으로 잠가버리는" 사고를 막을 수 있다.
  if (TERRITORY_OVERRIDES[original]) continue;
  if (seen.has(code)) continue;
  seen.set(code, {
    code,
    name: p.NAME_EN || p.NAME,
    nameKo: p.NAME_KO || p.NAME_EN || p.NAME,
  });
}

const list = [...seen.values()].sort((a, b) => a.nameKo.localeCompare(b.nameKo));
const outDir = path.join(__dirname, "..", "assets", "data");
fs.writeFileSync(
  path.join(outDir, "countries.json"),
  JSON.stringify(list, null, 2)
);
fs.writeFileSync(
  path.join(outDir, "countries-polygons.json"),
  JSON.stringify({ type: "FeatureCollection", features })
);
console.log(
  `countries.json: ${list.length} entries · countries-polygons.json: ${features.length} features`
);
