# 사진 기반 여행 기록 구현 계획

> **For agentic workers:** 이 plan은 inline으로 실행한다.

**Goal:** 폰의 사진 EXIF로 방문 국가/일수를 집계해 도트 지도에 잔디색으로 표시한다. 본국은 사용자가 첫 실행에서 선택하고, 본국 도트는 일수와 무관하게 파란색이다.

**Architecture:** Expo + zustand + expo-sqlite. 좌표→국가는 런타임 turf point-in-polygon. 사진은 expo-media-library로 enumerate(자동 스캔) / expo-image-picker로 다중 선택(수동 등록).

**Tech Stack:** React Native (Expo 54), TypeScript, zustand, expo-sqlite, expo-media-library, expo-image-picker, @turf/boolean-point-in-polygon, @react-native-async-storage/async-storage.

**Spec:** `docs/superpowers/specs/2026-05-06-photo-based-travel-tracking-design.md`

---

## 파일 구조

생성:
- `src/utils/date.ts` — epoch ms → `YYYY-MM-DD` (로컬)
- `src/features/travel/db.ts` — expo-sqlite 초기화/마이그레이션
- `src/features/travel/visitRepository.ts` — visit_days/photos CRUD + 집계
- `src/features/travel/visitStore.ts` — zustand: visitCounts, homeCountry, syncStatus
- `src/features/travel/homeCountryStorage.ts` — AsyncStorage 래퍼
- `src/features/photoSync/countryResolver.ts` — turf point-in-polygon
- `src/features/photoSync/photoLibrary.ts` — expo-media-library enumerate + EXIF 추출
- `src/features/photoSync/syncService.ts` — 자동 스캔 + 수동 등록 공통 파이프라인
- `src/screens/OnboardingScreen.tsx` — 본국 선택 + 권한 + 첫 스캔
- `src/screens/AddTripScreen.tsx` — 다중 사진 선택 + 그룹 미리보기
- `src/components/CountryPicker.tsx` — 검색 가능한 국가 리스트
- `assets/data/countries.geojson` — 정규화된 국경 폴리곤
- `assets/data/countries.json` — alpha-2 + 한/영 이름
- `scripts/generateCountries.mjs` — 위 두 파일을 빌드

수정:
- `src/utils/heatmap.ts` — `colorForVisit({ count, isHomeCountry })`
- `src/components/DotMap.tsx` — props에 `homeCountryCode` 추가, store 연결
- `App.tsx` — 부팅 시 onboarding 분기, 헤더에 "여행 추가" 버튼

---

## M1. DB · 스토어 · 색상

### Task 1.1 의존성 설치

- [ ] `npx expo install expo-sqlite expo-media-library expo-image-picker @react-native-async-storage/async-storage`
- [ ] `npm i @turf/boolean-point-in-polygon @turf/helpers`
- [ ] `npm i -D @types/geojson`

### Task 1.2 `src/utils/date.ts`

```ts
export function toLocalDateKey(epochMs: number): string {
  const d = new Date(epochMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
```

### Task 1.3 `src/utils/heatmap.ts` 수정

```ts
const PALETTE = ["#243b55", "#3aa66b", "#4ec97a", "#7cf08e", "#bdf99b"];
export const HOME_COLOR = "#2f6fed";
export const BG_COLOR = "#0b1220";

export function colorForVisit(opts: {
  count: number;
  isHomeCountry: boolean;
}): string {
  if (opts.isHomeCountry) return HOME_COLOR;
  const c = opts.count | 0;
  if (c <= 0) return PALETTE[0];
  if (c <= 2) return PALETTE[1];
  if (c <= 6) return PALETTE[2];
  if (c <= 13) return PALETTE[3];
  return PALETTE[4];
}
```

(기존 `colorForVisitCount`는 제거. 사용처는 DotMap뿐.)

### Task 1.4 `src/features/travel/db.ts`

```ts
import * as SQLite from "expo-sqlite";

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync("visitgrid.db");
  await _db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS visit_days (
      country_code TEXT NOT NULL,
      date TEXT NOT NULL,
      PRIMARY KEY (country_code, date)
    );
    CREATE TABLE IF NOT EXISTS visit_photos (
      id TEXT PRIMARY KEY,
      country_code TEXT NOT NULL,
      date TEXT NOT NULL,
      photo_uri TEXT NOT NULL,
      source TEXT NOT NULL,
      taken_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_visit_photos_country_date
      ON visit_photos (country_code, date);
  `);
  return _db;
}
```

### Task 1.5 `src/features/travel/visitRepository.ts`

```ts
import { getDb } from "./db";

export type VisitPhotoInput = {
  id: string;
  countryCode: string;
  date: string;       // YYYY-MM-DD
  photoUri: string;
  source: "auto" | "manual";
  takenAt: number;
};

export async function loadVisitCounts(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ country_code: string; days: number }>(
    `SELECT country_code, COUNT(*) AS days FROM visit_days GROUP BY country_code`
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.country_code] = r.days;
  return out;
}

export async function countPhotosForDay(
  countryCode: string,
  date: string
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM visit_photos WHERE country_code = ? AND date = ?`,
    countryCode,
    date
  );
  return row?.n ?? 0;
}

export async function addPhotos(inputs: VisitPhotoInput[]): Promise<void> {
  if (inputs.length === 0) return;
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    // 일별 3장 제한: 같은 (country, date) 묶음마다 잔여 슬롯 계산
    const groupKey = (i: VisitPhotoInput) => `${i.countryCode}|${i.date}`;
    const groups = new Map<string, VisitPhotoInput[]>();
    for (const i of inputs) {
      const k = groupKey(i);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(i);
    }
    for (const [, items] of groups) {
      const { countryCode, date } = items[0];
      const existing = await countPhotosForDay(countryCode, date);
      const slots = Math.max(0, 3 - existing);
      const toInsert = items.slice(0, slots);
      if (toInsert.length === 0) continue;
      await db.runAsync(
        `INSERT OR IGNORE INTO visit_days (country_code, date) VALUES (?, ?)`,
        countryCode,
        date
      );
      for (const ph of toInsert) {
        await db.runAsync(
          `INSERT OR IGNORE INTO visit_photos
             (id, country_code, date, photo_uri, source, taken_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          ph.id,
          ph.countryCode,
          ph.date,
          ph.photoUri,
          ph.source,
          ph.takenAt
        );
      }
    }
  });
}
```

### Task 1.6 `src/features/travel/homeCountryStorage.ts`

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "visitgrid:homeCountry";

export type HomeCountry = { code: string; name: string };

export async function loadHomeCountry(): Promise<HomeCountry | null> {
  const v = await AsyncStorage.getItem(KEY);
  return v ? (JSON.parse(v) as HomeCountry) : null;
}

export async function saveHomeCountry(c: HomeCountry): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(c));
}
```

### Task 1.7 `src/features/travel/visitStore.ts`

```ts
import { create } from "zustand";
import { loadVisitCounts } from "./visitRepository";
import {
  HomeCountry,
  loadHomeCountry,
  saveHomeCountry,
} from "./homeCountryStorage";

type State = {
  ready: boolean;
  homeCountry: HomeCountry | null;
  visitCounts: Record<string, number>;
  syncStatus: { running: boolean; processed: number; total: number };
  hydrate: () => Promise<void>;
  setHomeCountry: (c: HomeCountry) => Promise<void>;
  refreshVisits: () => Promise<void>;
  setSyncStatus: (s: State["syncStatus"]) => void;
};

export const useVisitStore = create<State>((set) => ({
  ready: false,
  homeCountry: null,
  visitCounts: {},
  syncStatus: { running: false, processed: 0, total: 0 },
  hydrate: async () => {
    const [home, counts] = await Promise.all([
      loadHomeCountry(),
      loadVisitCounts(),
    ]);
    set({ ready: true, homeCountry: home, visitCounts: counts });
  },
  setHomeCountry: async (c) => {
    await saveHomeCountry(c);
    set({ homeCountry: c });
  },
  refreshVisits: async () => {
    const counts = await loadVisitCounts();
    set({ visitCounts: counts });
  },
  setSyncStatus: (s) => set({ syncStatus: s }),
}));
```

### Task 1.8 `DotMap.tsx`에 store 연결

- `colorForVisitCount` import 제거, `colorForVisit` 사용.
- store에서 `visitCounts`, `homeCountry` 가져오기.
- `positioned` 계산:
  ```ts
  const fillFor = (countries: CountryRef[]) => {
    const primary = countries[0]?.code;
    const isHome = primary != null && primary === homeCountry?.code;
    const count = primary ? visitCounts[primary] ?? 0 : 0;
    return colorForVisit({ count, isHomeCountry: isHome });
  };
  ```
- 캡션: `selection.kind === "country"` 일 때 `{nation} · {visitCounts[code] ?? 0}일`.
- props `visitCounts` prop은 제거(스토어에서 직접 읽음).

### Task 1.9 커밋

```bash
git add -A
git commit -m "feat(travel): SQLite 스토어와 본국 파란색 색상 단계 추가"
```

---

## M2. 본국 선택 온보딩

### Task 2.1 `assets/data/countries.json` (alpha-2 + 한/영)

`scripts/generateCountries.mjs`로 생성한다(다음 태스크). 우선 형태:

```json
[
  { "code": "KR", "name": "South Korea", "nameKo": "대한민국" },
  ...
]
```

### Task 2.2 `scripts/generateCountries.mjs`

`scripts/ne_50m_countries.geojson`에서 ISO_A2_EH/ISO_A2/NAME/NAME_KO를
뽑아 `assets/data/countries.json`을 생성한다. NAME_KO가 없으면 NAME 사용.

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = JSON.parse(
  fs.readFileSync(path.join(__dirname, "ne_50m_countries.geojson"), "utf8")
);

const TERRITORY_OVERRIDES = {
  TF: "FR", PF: "FR", NC: "FR", WF: "FR", PM: "FR",
  AI: "GB", BM: "GB", IO: "GB", VG: "GB", FK: "GB",
  GS: "GB", MS: "GB", PN: "GB", SH: "GB", TC: "GB",
  AS: "US", GU: "US", MP: "US", PR: "US", VI: "US",
  NF: "AU", HM: "AU",
};

const seen = new Map();
for (const f of src.features) {
  const p = f.properties || {};
  let code =
    (p.ISO_A2_EH && p.ISO_A2_EH !== "-99" && p.ISO_A2_EH) ||
    (p.ISO_A2 && p.ISO_A2 !== "-99" && p.ISO_A2);
  if (!code) continue;
  code = TERRITORY_OVERRIDES[code] || code;
  if (seen.has(code)) continue;
  seen.set(code, {
    code,
    name: p.NAME_EN || p.NAME,
    nameKo: p.NAME_KO || p.NAME_EN || p.NAME,
  });
}
const list = [...seen.values()].sort((a, b) => a.nameKo.localeCompare(b.nameKo));
fs.writeFileSync(
  path.join(__dirname, "..", "assets", "data", "countries.json"),
  JSON.stringify(list, null, 2)
);
console.log(`countries.json: ${list.length} entries`);
```

실행: `node scripts/generateCountries.mjs`

### Task 2.3 `CountryPicker.tsx`

검색 입력 + FlatList. Props: `onSelect(code, name) => void`.
표시는 `nameKo` 우선, 보조로 영어 이름.

### Task 2.4 `OnboardingScreen.tsx`

- 본국 선택만 하면 닫힌다(권한·스캔은 메인에서 별도 트리거).
- 단, 닫기 직전에 `requestPermissionsAsync()`를 시도하고,
  허용되면 `runFullSync()`(M4)를 호출. 거부면 그냥 닫는다.

### Task 2.5 `App.tsx` 분기

```ts
const { ready, homeCountry, hydrate } = useVisitStore();
useEffect(() => { hydrate(); }, []);
if (!ready) return null;
if (!homeCountry) return <OnboardingScreen />;
return <Main />;
```

### Task 2.6 커밋

```bash
git add -A
git commit -m "feat(onboarding): 본국 선택 화면과 분기 추가"
```

---

## M3. 좌표 → 국가 resolver

### Task 3.1 `scripts/generateCountries.mjs` 확장 → GeoJSON도 출력

같은 영토 매핑을 적용해 `assets/data/countries.geojson`을 만들되,
`properties = { code }` 만 남긴다(번들 크기 절감).

```js
const out = {
  type: "FeatureCollection",
  features: src.features
    .map((f) => {
      const p = f.properties || {};
      let code =
        (p.ISO_A2_EH && p.ISO_A2_EH !== "-99" && p.ISO_A2_EH) ||
        (p.ISO_A2 && p.ISO_A2 !== "-99" && p.ISO_A2);
      if (!code) return null;
      code = TERRITORY_OVERRIDES[code] || code;
      return { type: "Feature", properties: { code }, geometry: f.geometry };
    })
    .filter(Boolean),
};
fs.writeFileSync(
  path.join(__dirname, "..", "assets", "data", "countries.geojson"),
  JSON.stringify(out)
);
```

### Task 3.2 `countryResolver.ts`

```ts
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, Polygon, MultiPolygon } from "geojson";
import countries from "../../../assets/data/countries.geojson";

type CountryFeature = Feature<Polygon | MultiPolygon, { code: string }>;
const features = (countries as { features: CountryFeature[] }).features;

// bbox 캐싱으로 1차 필터
type Box = [number, number, number, number]; // [minX,minY,maxX,maxY]
const boxes: Box[] = features.map((f) => bboxOf(f));

function bboxOf(f: CountryFeature): Box {
  let minX = 180, minY = 90, maxX = -180, maxY = -90;
  const visit = (coords: number[][]) => {
    for (const [x, y] of coords) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  };
  const g = f.geometry;
  if (g.type === "Polygon") for (const r of g.coordinates) visit(r);
  else for (const poly of g.coordinates) for (const r of poly) visit(r);
  return [minX, minY, maxX, maxY];
}

export function resolveCountry(lat: number, lng: number): string | null {
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
```

JSON import는 Metro 기본 지원. 필요 시 `metro.config.js`에 `resolver.assetExts`에 `geojson` 추가하거나 `require`로 로드.

### Task 3.3 커밋

```bash
git add -A
git commit -m "feat(geo): 좌표→국가 resolver와 정규화된 국경 데이터 추가"
```

---

## M4. 자동 스캔

### Task 4.1 `photoLibrary.ts`

```ts
import * as MediaLibrary from "expo-media-library";

export type PhotoMeta = {
  id: string;
  uri: string;
  lat: number;
  lng: number;
  takenAt: number; // epoch ms
};

export async function ensurePermission(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === "granted";
}

export async function* iteratePhotos(
  pageSize = 200
): AsyncGenerator<PhotoMeta, void, void> {
  let after: MediaLibrary.AssetRef | undefined;
  while (true) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: "photo",
      first: pageSize,
      after,
      sortBy: [["creationTime", false]],
    });
    for (const a of page.assets) {
      const info = await MediaLibrary.getAssetInfoAsync(a, {
        shouldDownloadFromNetwork: false,
      });
      const loc = info.location;
      if (!loc) continue;
      yield {
        id: a.id,
        uri: info.localUri ?? a.uri,
        lat: loc.latitude,
        lng: loc.longitude,
        takenAt: a.creationTime,
      };
    }
    if (!page.hasNextPage) return;
    after = page.endCursor;
  }
}
```

### Task 4.2 `syncService.ts`

```ts
import { addPhotos, VisitPhotoInput } from "../travel/visitRepository";
import { useVisitStore } from "../travel/visitStore";
import { resolveCountry } from "./countryResolver";
import { iteratePhotos, ensurePermission } from "./photoLibrary";
import { toLocalDateKey } from "../../utils/date";

export async function runFullSync(): Promise<{ added: number }> {
  const ok = await ensurePermission();
  if (!ok) return { added: 0 };
  const { setSyncStatus, refreshVisits } = useVisitStore.getState();
  setSyncStatus({ running: true, processed: 0, total: 0 });

  const buffer = new Map<string, VisitPhotoInput[]>(); // country|date -> []
  let processed = 0;
  for await (const p of iteratePhotos()) {
    processed++;
    if (processed % 50 === 0) {
      setSyncStatus({ running: true, processed, total: 0 });
    }
    const code = resolveCountry(p.lat, p.lng);
    if (!code) continue;
    const date = toLocalDateKey(p.takenAt);
    const key = `${code}|${date}`;
    const list = buffer.get(key) ?? [];
    if (list.length >= 3) continue; // 일별 3장 캡
    list.push({
      id: p.id,
      countryCode: code,
      date,
      photoUri: p.uri,
      source: "auto",
      takenAt: p.takenAt,
    });
    buffer.set(key, list);
  }

  const all: VisitPhotoInput[] = [];
  for (const [, items] of buffer) all.push(...items);
  await addPhotos(all);
  await refreshVisits();
  setSyncStatus({ running: false, processed, total: processed });
  return { added: all.length };
}
```

### Task 4.3 헤더에 진행률 표시

`App.tsx`에서 `syncStatus.running`이면 헤더 아래에 얇은 띠로
`스캔 중 · {processed}장 처리됨` 표시.

### Task 4.4 OnboardingScreen에서 호출

본국 저장 직후 비동기로 `runFullSync()` 트리거(await 안 함, fire-and-forget).
실패해도 메인은 정상 진입.

### Task 4.5 커밋

```bash
git add -A
git commit -m "feat(sync): 첫 실행 자동 사진 스캔 파이프라인 추가"
```

---

## M5. 수동 등록 화면

### Task 5.1 헤더 "여행 추가" 버튼

`App.tsx` 헤더에 버튼 → `setScreen("addTrip")` 같은 단순 라우팅
(react-navigation 도입 없이 useState 라우팅 — MVP 범위).

### Task 5.2 `AddTripScreen.tsx`

흐름:
1. 마운트 시 `expo-image-picker`의 `launchImageLibraryAsync({ allowsMultipleSelection: true, exif: true })`.
2. 결과 각 asset에서 lat/lng/takenAt 추출:
   - `asset.exif?.GPSLatitude/GPSLongitude` (있으면 사용)
   - 없으면 `asset.exif?.GPSLatitudeRef` 부호 반영
   - `asset.exif?.DateTimeOriginal` → epoch
   - 둘 중 하나라도 없으면 "GPS 없음"으로 분류.
3. resolveCountry로 코드 매핑 → `(code, date)` 그룹핑.
4. 각 그룹 카드 표시:
   - 사진 ≤3장이면 그대로 등록.
   - 사진 >3장이면 "어느 3장을 등록할까요?"로 토글 UI(선택된 것만 INSERT).
5. "확정" → `addPhotos`(트랜잭션) → `refreshVisits` → 메인으로 복귀.

UI는 단순한 ScrollView + 그룹별 Section + 썸네일 토글.

### Task 5.3 커밋

```bash
git add -A
git commit -m "feat(manual): 다중 사진 수동 등록 화면 추가"
```

---

## 검증 (수동, 디바이스 또는 시뮬레이터)

- [ ] 앱 첫 실행 → 본국 선택 → 권한 동의 → 스캔 진행률 → 도트 일부가 잔디색으로 변함
- [ ] 본국 도트는 파란색
- [ ] DotMap에서 도트 탭 → "{나라} · N일 방문" 표시
- [ ] 헤더 "여행 추가" → 사진 4장 이상 같은 날 선택 → 3장 선택 UI 표시 → 확정 → 도트 갱신
- [ ] GPS 없는 사진은 "건너뜀"
- [ ] 앱 재시작해도 visitCounts 유지 (SQLite)

자동화 단위 테스트는 도입하지 않는다(현 프로젝트에 jest 미설정).
중요한 순수 함수(`colorForVisit`, `resolveCountry`, `toLocalDateKey`)는
필요 시 후속에서 jest 도입 후 추가.
