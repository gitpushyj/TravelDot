// GeoBoundaries CGAZ ADM0 데이터(OSM 기반)를 현재 앱이 쓰는 단순 GeoJSON 스키마
// ({ type:'FeatureCollection', features:[{ properties:{code}, geometry }] })로 변환한다.
//
// 왜 GeoBoundaries인가:
//   Natural Earth 1:10m / 1:50m 모두 말레이시아 사바주(코타키나발루·산다칸)와
//   페낭섬 등을 polygon ring에서 빼먹어 GPS 사진이 매칭되지 않는 알려진 결함이 있다.
//   GeoBoundaries(OSM 기반)는 사바주를 잡지만 데이터가 매우 크므로 mapshaper로
//   Visvalingam 5% 단순화한 중간 파일을 입력으로 받는다.
//
// 워크플로:
//   1) 원본 다운로드:
//      curl -L -o /tmp/gbcgaz.geojson \
//        https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/CGAZ/geoBoundariesCGAZ_ADM0.geojson
//   2) mapshaper 단순화 (visvalingam 5%, keep-shapes로 작은 섬 보존):
//      npx mapshaper /tmp/gbcgaz.geojson -simplify visvalingam 5% keep-shapes \
//        -o format=geojson /tmp/gb_s5.geojson
//   3) 이 스크립트 실행:
//      node scripts/buildCountryPolygons.js \
//        /tmp/gb_s5.geojson assets/data/countries-polygons.json
//
// 한계:
//   - 단순화로 사바주 동남부(타와우·라하닷투)와 몰디브 작은 환초 등은 매칭이
//     누락된다(원본 GeoBoundaries에서도 일부 누락).
//   - GeoBoundaries CGAZ는 홍콩/마카오를 중국에 묶으므로 별도 feature가 없다.
//     기존 파일의 HK/MO 폴리곤을 그대로 보강한다(완벽하진 않지만 회귀 방지).

const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
const DST = process.argv[3];
const OLD = path.resolve(__dirname, '..', 'assets/data/countries-polygons.json');
const COORD_PRECISION = 3; // 약 110m 정밀도. 도시 단위 매칭에 충분하고 파일 크기 절감.

if (!SRC || !DST) {
  console.error('Usage: node scripts/buildCountryPolygons.js <simplified.geojson> <output.json>');
  process.exit(1);
}

const factor = 10 ** COORD_PRECISION;
const round = (n) => Math.round(n * factor) / factor;

function dedupRing(ring) {
  const out = [];
  let px = null;
  let py = null;
  for (const [x, y] of ring) {
    const rx = round(x);
    const ry = round(y);
    if (rx === px && ry === py) continue;
    out.push([rx, ry]);
    px = rx;
    py = ry;
  }
  return out;
}

function fixGeometry(g) {
  if (g.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: g.coordinates.map(dedupRing).filter((r) => r.length >= 4),
    };
  }
  if (g.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: g.coordinates
        .map((poly) => poly.map(dedupRing).filter((r) => r.length >= 4))
        .filter((poly) => poly.length > 0),
    };
  }
  return g;
}

const ISO3_TO_ISO2 = require('./iso3_to_iso2.json');

const src = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const out = [];
const presentCodes = new Set();

for (const ft of src.features) {
  const iso3 = ft.properties.shapeGroup;
  const code = ISO3_TO_ISO2[iso3];
  if (!code) continue;
  const g = fixGeometry(ft.geometry);
  const hasCoords =
    (g.type === 'Polygon' && g.coordinates.length > 0) ||
    (g.type === 'MultiPolygon' && g.coordinates.length > 0);
  if (!hasCoords) continue;
  out.push({ type: 'Feature', properties: { code }, geometry: g });
  presentCodes.add(code);
}

// 기존 파일에 있고 GeoBoundaries CGAZ에 없는 코드(HK, MO, MV, KY 등 자치/속령)는
// 옛 데이터에서 그대로 보강한다. 보강분은 features 앞쪽에 둬서 큰 country 폴리곤보다
// 먼저 매칭되도록 한다(예: HK가 CN보다 우선).
const old = JSON.parse(fs.readFileSync(OLD, 'utf8'));
const restored = [];
const restoredFeatures = [];
const seenRestored = new Set();
for (const ft of old.features) {
  const c = ft.properties.code;
  if (presentCodes.has(c)) continue;
  restoredFeatures.push(ft);
  if (!seenRestored.has(c)) {
    seenRestored.add(c);
    restored.push(c);
  }
}

const final = {
  type: 'FeatureCollection',
  features: [...restoredFeatures, ...out],
};

fs.writeFileSync(DST, JSON.stringify(final));
const size = fs.statSync(DST).size;
console.log(`Wrote ${final.features.length} features → ${DST} (${(size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`From GeoBoundaries: ${out.length} features (${presentCodes.size} unique codes)`);
console.log(`Restored from old: ${restored.length} codes — ${restored.join(', ')}`);
