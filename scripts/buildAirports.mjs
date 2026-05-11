#!/usr/bin/env node
// OurAirports CSV에서 large_airport + IATA 코드 있는 + 정기 운항 공항만 추출해
// assets/data/airports.json 으로 저장한다.
//
// 사용:
//   node scripts/buildAirports.mjs /tmp/airports.csv

import fs from "node:fs";
import path from "node:path";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("usage: node scripts/buildAirports.mjs <airports.csv>");
  process.exit(1);
}

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outPath = path.join(repoRoot, "assets/data/airports.json");

// 단순 CSV 파서. OurAirports의 airports.csv는 quote/escape 패턴이 단순한 RFC4180.
// keywords·name 필드에 큰따옴표 안 ","와 escaped 큰따옴표 ""만 처리하면 충분.
function parseCsvLine(line) {
  const cells = [];
  let i = 0;
  const len = line.length;
  while (i < len) {
    let cell = "";
    if (line[i] === '"') {
      i++;
      while (i < len) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            cell += '"';
            i += 2;
          } else {
            i++;
            break;
          }
        } else {
          cell += line[i];
          i++;
        }
      }
    } else {
      while (i < len && line[i] !== ",") {
        cell += line[i];
        i++;
      }
    }
    cells.push(cell);
    if (i < len && line[i] === ",") {
      i++;
      // 마지막 문자가 ","이면 trailing empty cell이 하나 더 있다는 의미.
      // 위 while 루프는 i >= len이 되면 끝나서 trailing empty cell을 빼먹는다.
      if (i === len) cells.push("");
    }
  }
  return cells;
}

const raw = fs.readFileSync(csvPath, "utf8");
const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
const header = parseCsvLine(lines[0]);
const idx = (key) => header.indexOf(key);

const I_TYPE = idx("type");
const I_NAME = idx("name");
const I_LAT = idx("latitude_deg");
const I_LNG = idx("longitude_deg");
const I_COUNTRY = idx("iso_country");
const I_MUNI = idx("municipality");
const I_SCHED = idx("scheduled_service");
const I_IATA = idx("iata_code");

if ([I_TYPE, I_NAME, I_LAT, I_LNG, I_COUNTRY, I_MUNI, I_SCHED, I_IATA].some((i) => i < 0)) {
  console.error("CSV header missing expected columns:", header);
  process.exit(1);
}

const out = [];
const seenIata = new Set();
for (let row = 1; row < lines.length; row++) {
  const cells = parseCsvLine(lines[row]);
  // CSV 끝부분 빈 컬럼(keywords 등)이 한두 개 빠져 있을 수 있으므로, 필수 컬럼들이
  // 모두 닿을 만큼만 있으면 진행한다.
  const minLen = Math.max(I_TYPE, I_NAME, I_LAT, I_LNG, I_COUNTRY, I_MUNI, I_SCHED, I_IATA) + 1;
  if (cells.length < minLen) continue;

  const type = cells[I_TYPE];
  if (type !== "large_airport") continue;

  const iata = (cells[I_IATA] || "").trim().toUpperCase();
  if (!iata) continue;
  if (iata.length !== 3) continue; // IATA는 3글자.
  if (seenIata.has(iata)) continue;

  const sched = cells[I_SCHED];
  if (sched !== "yes") continue;

  const lat = Number(cells[I_LAT]);
  const lng = Number(cells[I_LNG]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

  const name = cells[I_NAME].trim();
  const city = (cells[I_MUNI] || "").trim();
  const country = cells[I_COUNTRY].trim().toUpperCase();
  if (!name || !country) continue;

  seenIata.add(iata);
  out.push({
    iata,
    name,
    city: city || name,
    country,
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4)),
  });
}

// IATA 알파벳 순 정렬해 diff를 안정화한다.
out.sort((a, b) => (a.iata < b.iata ? -1 : a.iata > b.iata ? 1 : 0));

fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`wrote ${out.length} airports → ${outPath}`);
