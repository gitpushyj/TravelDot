# 사진 기반 자동 여행 기록 기능 설계

> 사진 라이브러리의 GPS·촬영일 EXIF로 방문 국가/일수를 자동 집계하여
> 도트 지도에 잔디색으로 시각화한다.

작성일: 2026-05-06

---

## 1. 목표

폰의 사진 라이브러리를 1회 자동 스캔하고, 이후 사용자가 수동으로 사진을
추가 등록하여, "어느 나라에서 며칠을 보냈는지"를 도트 지도에 잔디색
농도로 표시한다.

- **본국**은 사용자가 첫 실행에서 직접 선택한다. 본국 도트는 일수와
  무관하게 파란색으로 고정한다.
- **해외**는 본국 외 모든 나라이며, 같은 나라에서 사진이 찍힌
  **고유 날짜 수**(distinct local date)로 잔디색이 5단계로 짙어진다.

## 2. 비목표

- 서버 동기화·계정·소셜 공유는 다루지 않는다.
- 첫 스캔 외의 자동/백그라운드 동기화는 하지 않는다.
- 위치 정보가 없는 사진을 보정하지 않는다(스킵 처리).
- 도트 그리드 자체의 변경(해상도/투영)은 다루지 않는다.

## 3. UX 흐름

### 3.1 최초 실행 (Onboarding)

1. **본국 선택 화면**
   - 검색 가능한 국가 목록(`assets/data/countries.json`의 alpha-2 코드 + 한글/영문명).
   - 선택 즉시 `AsyncStorage`에 `{ code, name }` 저장.
   - "건너뛰기" 없음. 본국이 정해져야 색상 분기가 성립.
2. **사진 라이브러리 권한 요청**
   - `expo-media-library`의 `requestPermissionsAsync()`.
   - 거부 시 "나중에 설정에서 권한을 허용하면 자동 스캔이 가능합니다" 안내 후 메인 진입.
3. **자동 스캔**
   - 권한 동의 시 즉시 시작. 진행률(스캔 N/총 M) 표시.
   - 완료 후 메인(DotMap) 진입.

### 3.2 메인 (DotMap)

- 헤더에 **여행 추가** 버튼 1개.
- 도트 색칠 규칙:
  - 본국 도트(`countryCode == homeCountry`): 파란색 고정.
  - 해외 도트: 일수 단계별 잔디색.
  - 미방문 도트: 기존 회색 유지.
- 도트 탭 시 기존 노란색 강조는 그대로 두되, 캡션에
  `"{나라} · {일수}일 방문"` 으로 표시한다.

### 3.3 여행 추가 (수동 등록)

1. 사진 다중 선택(`expo-image-picker`의 `allowsMultipleSelection`).
2. 각 사진의 EXIF에서 `{ lat, lng, takenAt }` 추출.
   - `expo-media-library`의 `getAssetInfoAsync`로 `location` + `creationTime` 우선 사용.
   - 누락된 사진은 "GPS 없음"으로 표시하고 합계에서 제외.
3. 좌표 → 국가 판정(turf point-in-polygon).
4. `(국가, 날짜)`로 그룹핑된 미리보기 리스트 표시.
   - 각 그룹에 사진 썸네일.
   - 그룹 내 사진이 4장 이상이면 사용자가 **유지할 3장을 선택**해야 확정 가능.
   - 이미 DB에 동일 `(국가, 날짜)` 사진이 있다면 잔여 슬롯만큼만 등록 가능.
5. **확정** 버튼 → 트랜잭션으로 일괄 INSERT → 도트 색 즉시 갱신.

## 4. 데이터 모델

### 4.1 AsyncStorage

```ts
// key: "visitgrid:homeCountry"
type HomeCountry = { code: string; name: string };
```

### 4.2 SQLite (`expo-sqlite`)

```sql
CREATE TABLE IF NOT EXISTS visit_days (
  country_code TEXT NOT NULL,
  date TEXT NOT NULL,         -- 'YYYY-MM-DD' (사진 촬영의 로컬 날짜)
  PRIMARY KEY (country_code, date)
);

CREATE TABLE IF NOT EXISTS visit_photos (
  id TEXT PRIMARY KEY,        -- expo-media-library asset id 또는 uuid
  country_code TEXT NOT NULL,
  date TEXT NOT NULL,
  photo_uri TEXT NOT NULL,
  source TEXT NOT NULL,       -- 'auto' | 'manual'
  taken_at INTEGER NOT NULL,  -- epoch ms
  FOREIGN KEY (country_code, date) REFERENCES visit_days(country_code, date)
);

CREATE INDEX IF NOT EXISTS idx_visit_photos_country_date
  ON visit_photos (country_code, date);
```

집계는 view 없이 바로 쿼리:

```sql
SELECT country_code, COUNT(*) AS days
FROM visit_days
GROUP BY country_code;
```

### 4.3 일별 3장 제한

DB 제약이 아닌 **앱 레이어**에서 강제한다.
- INSERT 직전 `(country_code, date)`의 현재 사진 수를 조회.
- `현재 + 추가 > 3` 이면 등록 거부 또는 사용자에게 선택 요청(수동 등록 흐름).
- 자동 스캔에서는 정렬 후 앞 3장만 INSERT, 나머지는 무시.

## 5. 색상 매핑

`src/utils/heatmap.ts`의 `colorForVisitCount(count: number)`를
`colorForVisit({ count: number; isHomeCountry: boolean })`로 확장.

```
isHomeCountry=true  → "#2f6fed"  (본국 파란색, 일수 무관)
count = 0           → "#243b55"  (기존 BG, 미방문)
count = 1~2         → "#3aa66b"
count = 3~6         → "#4ec97a"
count = 7~13        → "#7cf08e"
count >= 14         → "#bdf99b"
```

`PALETTE` 배열은 유지하되 단계 임계값 함수만 수정한다.

## 6. 좌표 → 국가 판정

런타임 GeoJSON point-in-polygon.

- 데이터: `assets/data/countries.geojson`
  (build-time에 `scripts/ne_50m_countries.geojson`을 alpha-2 코드 정규화하여 복사).
- 라이브러리: `@turf/boolean-point-in-polygon` + `@turf/helpers`
  (`@turf/turf` 전체 import 금지 — 번들 크기).
- 인터페이스:
  ```ts
  // src/features/photoSync/countryResolver.ts
  function resolveCountry(lat: number, lng: number): string | null;
  ```
- 영토 통합 매핑은 기존 커밋 `8655fb9`의 정책을 그대로 사용
  (해외 영토 → 본국 코드).

## 7. 모듈 구조

```
src/
  features/
    photoSync/
      photoLibrary.ts       // 권한, 자산 enumerate, EXIF 추출
      countryResolver.ts    // GeoJSON point-in-polygon
      syncService.ts        // 자동 스캔 + 수동 등록 공통 파이프라인
    travel/
      db.ts                 // expo-sqlite 초기화/마이그레이션
      visitRepository.ts    // visit_days/photos CRUD, 집계
      visitStore.ts         // zustand: visitCounts, homeCountry, syncStatus
  screens/
    OnboardingScreen.tsx    // 본국 선택 + 권한 + 첫 스캔
    AddTripScreen.tsx       // 다중 사진 선택 + 그룹 미리보기 + 3장 선택
  components/
    DotMap.tsx              // props에 homeCountryCode 추가
    CountryPicker.tsx       // 검색 가능한 국가 리스트
  utils/
    heatmap.ts              // colorForVisit 변경
    date.ts                 // epoch ms → 'YYYY-MM-DD' (로컬 타임존)
assets/data/
  countries.json            // alpha-2 + 한/영 이름
  countries.geojson         // 런타임 point-in-polygon용
```

## 8. 의존성 추가

- `expo-media-library`
- `expo-image-picker`
- `expo-sqlite`
- `@react-native-async-storage/async-storage`
- `@turf/boolean-point-in-polygon`
- `@turf/helpers`

## 9. 핵심 결정과 근거

| 결정 | 근거 |
| --- | --- |
| EXIF는 `expo-media-library`의 `getAssetInfoAsync`만 사용 | iOS/Android에서 location·creationTime을 안정적으로 제공. 별도 EXIF 파서 의존성 제거 |
| 본국 사진은 저장은 하되 도트는 파란 고정 | 본국 변경 시(차후) 재계산 가능하도록 데이터는 보존, 시각은 단순화 |
| 일별 3장 제한은 앱 레이어 | DB 트리거보다 사용자 선택 UI와 결합하기 쉬움 |
| 좌표→국가는 런타임 GeoJSON | 도트 격자 매핑은 5°/8° 해상도 한계로 국경 근처에서 부정확 |
| 시간대는 사진의 로컬 날짜 그대로 | 여행 중 타임존 추적은 비용 대비 효용 낮음 |

## 10. 에지 케이스

- GPS 없는 사진: 스킵하고 미리보기에 "건너뜀 N장" 표시.
- 좌표가 어떤 폴리곤에도 속하지 않는 경우(공해 등): 스킵.
- 자동 스캔 + 수동 등록이 같은 `(국가, 날짜)`에 사진 추가 → 합산 후 3장 초과분 거부.
- 첫 스캔 도중 앱 종료: 재개하지 않음. 다음 실행 시 처음부터 다시
  돌리되 `INSERT OR IGNORE`로 중복 무해화.
- 권한 거부: 메인 진입 가능, "여행 추가"에서도 권한을 다시 요청.

## 11. 테스트 전략

- `colorForVisit`: 본국 플래그·각 단계 경계값 단위 테스트.
- `resolveCountry`: 한국/일본/미국 본토/하와이/괌 등 좌표 입력 → 기대 alpha-2 코드.
- `visitRepository.addPhotos`: `(국가, 날짜)` 잔여 슬롯 계산, 초과 INSERT 거부.
- 수동 등록 화면: 같은 날 4장 선택 시 3장 선택 UI가 강제되는지.

## 12. 마일스톤

1. **M1** — DB·스토어·색상 단계 변경
   - `expo-sqlite` + `visitRepository` + `visitStore`(zustand)
   - `colorForVisit` 5단계 + 본국 파란색
   - DotMap이 store의 `visitCounts` + `homeCountry`로 렌더
2. **M2** — 본국 선택 온보딩
   - `OnboardingScreen` + `CountryPicker`
   - AsyncStorage 영속화, 앱 부팅 시 분기
3. **M3** — 좌표→국가 resolver
   - `countries.geojson` 자산화, `resolveCountry()` 구현·테스트
4. **M4** — 자동 스캔
   - 권한, 자산 enumerate, EXIF, 그룹핑, 일별 3장 제한, 트랜잭션 INSERT
   - 진행률 UI
5. **M5** — 수동 등록 화면
   - 다중 사진 선택, 그룹 미리보기, 3장 선택 UI, 확정

## 13. 미해결 / 차후

- 본국 변경 UI는 차후. 변경 시 visitCounts는 자동 재계산만 하면 됨(데이터 보존).
- 사진 1장만 골라 등록하는 경량 흐름은 차후.
- 통계 화면(총 일수/국가 수 등)은 기존 기획 7.4의 범위로 유지.
