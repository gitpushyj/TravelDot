# 국가 상세 페이지 리디자인 — 디자인 스펙

작성일: 2026-05-15
대상 화면: `CountryDetailScreen` (`src/screens/CountryDetailScreen.tsx`)

## 1. 목적

기존 국가 상세 페이지에서 hero(도트맵 카드)와 통계 카드(방문/일/사진)가 분리되어 있어 첫 화면 임팩트가 약하고 시선이 분산된다. 두 영역을 **하나의 컬러 hero 카드**로 통합하여 정보 밀도를 높이고, 빈 상태(여행 기록이 없는 국가)에는 일러스트를 추가하여 시각적 친밀감을 키운다.

## 2. 변경 범위

### 전면 리뉴얼
- **Hero 카드**: 좌상단 국가명(큰 텍스트) + 우측 도트맵 + 하단 통계 3개를 한 카드로 통합. 배경은 국가별 동적 색(`colorForCountry(code).bg`) 유지.
- **별도 통계 카드 삭제**: `statsCard` 블록과 관련 스타일(`statCol`, `statNum`, `statUnit`, `statDivider`)을 Hero 내부 전용으로 이전.
- **빈 상태(Empty State)**: 텍스트 1줄만 있던 빈 상태에 일러스트(카메라+폴라로이드+비행기) 추가, 텍스트는 2줄로 변경.

### 그대로 유지
- 상단 헤더 (뒤로 / 🇰🇷 국가명 KR / 편집 아이콘)
- "여행 기록 ⊕" 섹션 헤더 + "최신순" 표시 + 병합 버튼
- 여행 카드 리스트(`TripRow`), 연도 그룹핑, 편집 모드(swipe 삭제)
- 데이터 로딩 로직 (`loadTripsForCountry`, `countPhotosForCountry` 등)

## 3. Hero 카드 상세

### 레이아웃 구조
```
┌────────────────────────────────────────────┐
│ ╭───────────────┬──────────────────────╮   │
│ │ 한국          │                       │   │  ← 상단 영역
│ │ KR            │     [CountryDotMap]   │   │     (텍스트 ↔ 도트맵)
│ │               │                       │   │
│ ╰───────────────┴──────────────────────╯   │
│ ╭────────┬─────────┬────────╮              │
│ │   💼   │   📅    │   🖼   │              │  ← 하단 통계 영역
│ │    0   │    0    │    0   │              │     (3컬럼 + 세로 구분선)
│ │ 회 방문 │ 일 누적 │장의 사진│              │
│ ╰────────┴─────────┴────────╯              │
└────────────────────────────────────────────┘
```

### 시각 사양
- **배경색**: `colorForCountry(code).bg` (국가별 동적 — 기존 그대로)
- **모서리 반지름**: 24 (기존 그대로)
- **카드 높이**: `minHeight: 320` + 내부 padding 으로 자연스럽게 흐르도록. 종횡비 fix 제거 (`aspectRatio: 16/11` 삭제).
- **카드 패딩**: 20 (상하좌우)

### 상단 영역 (텍스트 ↔ 도트맵)
- 가로 분할: 좌 텍스트 ~45%, 우 도트맵 ~55%
- **국가명**: `getCountryName(code, locale)`, fontSize 32, fontWeight 800, color `#FFFFFF`, 1~2줄 wrap 허용 (`numberOfLines={2}`)
- **국가 코드**: `code`, fontSize 14, fontWeight 700, color `rgba(255,255,255,0.7)`, 국가명 바로 아래
- **도트맵**: 기존 `CountryDotMap` 컴포넌트 그대로 사용. `color` prop에는 `colorForCountry(code).dot` 대신 흰색 톤(`rgba(255,255,255,0.95)`)을 직접 전달하여 어떤 배경색 위에서도 잘 보이게 함.
  - 도트맵을 우측 영역에 채우려면 폭 제한 컨테이너(`flex: 0 0 ~55%` 또는 `width` 직접 지정)로 감싸고, `CountryDotMap` 내부는 그대로 두면 자체 viewBox로 contain된다.

### 하단 통계 영역 (3컬럼)
- 상단 영역과 통계 영역 사이 여백: 16
- 통계 영역과 상단 영역 사이를 시각적으로 분리하기 위해, 첨부 디자인처럼 **하단 영역 배경에 살짝 더 어두운 톤의 반투명 흰색 웨이브/오버레이**를 깔지 여부는 구현자 재량 (없어도 디자인 의도는 충족). 기본은 **오버레이 없음** — 단순함 우선.
- 3컬럼 균등 분할. 컬럼 사이 세로 구분선 1px, color `rgba(255,255,255,0.25)`, 높이 ~60%.
- 각 컬럼 내부 (위→아래):
  - 아이콘 (24px, 흰색)
  - 숫자 (fontSize 26, fontWeight 800, 흰색) — 약간의 위 여백 6
  - 라벨 (fontSize 12, fontWeight 600, `rgba(255,255,255,0.75)`) — 약간의 위 여백 2
- **아이콘 매핑** (lucide-react-native):
  - 방문 수 → `Briefcase`
  - 일 누적 → `Calendar`
  - 사진 수 → `Image`
- **라벨 i18n 키** (기존 그대로 재사용):
  - `countryDetail.statVisits` ("회 방문")
  - `countryDetail.statDays` ("일 누적")
  - `countryDetail.statPhotos` ("장의 사진")

### 새 컴포넌트
- `src/screens/CountryDetailScreen/HeroCard.tsx`
  - **Props**: `{ code: string; name: string; visits: number; days: number; photos: number; }`
  - 내부: 상단 영역(텍스트 + 도트맵), 하단 영역(3컬럼 통계) 모두 포함
  - export default

- `src/screens/CountryDetailScreen/HeroCard.styles.ts`
  - HeroCard 전용 스타일 (`makeHeroStyles(theme)` 패턴)

## 4. 빈 상태 (Empty State)

### 자산
- **`assets/empty-trips.png`** — 사용자가 첨부한 일러스트(카메라 + 폴라로이드 2장 + 점선 비행기 궤적).
- 사용자가 직접 해당 파일을 `assets/` 디렉터리에 떨어뜨려 주신다 (또는 첨부 이미지 경로에서 복사). 구현 단계에서 파일 존재 여부 확인.

### UI 구성
- 일러스트 폭 ~200, `resizeMode: "contain"`, 가운데 정렬
- 그 아래 텍스트 2줄, 가운데 정렬, 줄간격 적당
  - 1줄: `t("countryDetail.emptyLine1")`
  - 2줄: `t("countryDetail.emptyLine2")`
- 텍스트 색: `theme.textSecondary`, fontSize 14, fontWeight 500
- 위 여백: 일러스트 위쪽 paddingTop 40, 일러스트와 텍스트 사이 16, 텍스트 아래 paddingBottom 24

### 새 컴포넌트
- `src/screens/CountryDetailScreen/EmptyTrips.tsx`
  - **Props 없음** (i18n + theme 훅 내부에서 호출)
  - export default

## 5. i18n 변경

### 키 변경

| 키 | 처리 |
|---|---|
| `countryDetail.empty` | **삭제** (대체됨) |
| `countryDetail.emptyLine1` | **신규 추가** |
| `countryDetail.emptyLine2` | **신규 추가** |

### 번역 (10개 locale 전부 동시 반영 — CLAUDE.md 8조)

| Locale | emptyLine1 | emptyLine2 |
|---|---|---|
| ko | 아직 이 나라의 | 여행 기록이 없어요. |
| en | No trips to | this country yet. |
| ja | まだこの国の | 旅行記録がありません。 |
| zh-CN | 还没有 | 这个国家的旅行记录。 |
| zh-TW | 還沒有 | 這個國家的旅行記錄。 |
| es | Aún no hay viajes | a este país. |
| fr | Aucun voyage | dans ce pays. |
| de | Noch keine Reisen | in dieses Land. |
| it | Nessun viaggio | in questo paese. |
| ru | Поездок в эту | страну пока нет. |

> 위 번역은 초안이며, 구현 시 각 언어로 더 자연스러운 표현이 있으면 채택. 핵심: **2줄로 자연스럽게 끊어지는 의역**이어야 한다. 줄바꿈 위치는 화면 폭과 어울리도록 조정 가능.

### 기타 i18n
- `countryDetail.statVisits` / `statDays` / `statPhotos` — 그대로
- `countryDetail.sectionTrips` / `sortLatest` / `mergeButton` / `swipeToDelete` — 그대로

## 6. 영향받는 파일

### 신규
- `src/screens/CountryDetailScreen/HeroCard.tsx`
- `src/screens/CountryDetailScreen/HeroCard.styles.ts`
- `src/screens/CountryDetailScreen/EmptyTrips.tsx`
- `src/screens/CountryDetailScreen/EmptyTrips.styles.ts`
- `assets/empty-trips.png` (사용자 첨부 PNG)

### 수정
- `src/screens/CountryDetailScreen.tsx` — Hero/Stats 영역을 `<HeroCard ... />` 한 줄로 교체, 빈 상태를 `<EmptyTrips />`로 교체
- `src/screens/CountryDetailScreen/styles.ts` — `heroCard`, `heroDots`, `statsCard`, `statCol`, `statNum`, `statUnit`, `statDivider` 관련 스타일 제거 (HeroCard 전용 styles 파일로 이전)
- `src/i18n/locales/ko.json`, `en.json`, `ja.json`, `zh-CN.json`, `zh-TW.json`, `es.json`, `fr.json`, `de.json`, `it.json`, `ru.json` (총 10개) — `empty` 키 제거, `emptyLine1`/`emptyLine2` 추가

## 7. 검증 계획

### 수동 확인 (시뮬레이터/디바이스)
- [ ] 여행 기록이 있는 국가 → Hero 카드 내 숫자(visits/days/photos) 정상 노출 + 도트맵 정상
- [ ] 여행 기록이 0인 국가 → 빈 상태 일러스트 + 2줄 텍스트 노출
- [ ] 다크모드 토글 → Hero는 그대로(고정 흰색 텍스트 + 국가 색 배경), 빈 상태 일러스트가 어색하지 않은지 확인
- [ ] 긴 국가명 (예: United States, North Macedonia, Bosnia and Herzegovina) → 텍스트 wrap 2줄, 도트맵 영역 침범 X
- [ ] 짧은 국가명 (예: 한국, 일본, US) → 시각적 균형 OK
- [ ] 편집 모드 진입 → swipe 삭제 정상
- [ ] 병합 버튼 (여행 2개 이상) → 정상 노출
- [ ] 언어 전환 (10개 locale) → 모든 텍스트 정상, JSON parse 통과

### 자동 확인
- TypeScript 타입 에러 없음 (`tsc --noEmit` 통과)
- 모든 locale JSON `JSON.parse` 가능 (필요 시 `node -e "require('./src/i18n/locales/<lang>.json')"`)

## 8. 비-범위 (Out of Scope)

- `TripRow` 카드 디자인 변경 없음 (썸네일/배지/날짜 표기 동일)
- 여행 추가/편집/병합/삭제 동작 변경 없음
- 다른 화면(홈, 통계, 프로필 등) 디자인 변경 없음
- 도트맵 컴포넌트(`CountryDotMap`) 내부 로직 변경 없음 (단, 배경이 컬러로 바뀌면서 도트 색이 흰색 계열로 변경됨)
- 새 i18n 키 외 텍스트/카피 변경 없음

## 9. 결정 로그

- ✅ Hero 배경색: 국가별 동적 색(`colorForCountry`) 유지
- ✅ 빈 상태: 첨부 PNG 자산 사용 (SVG 직접 구현 X, lucide 조합 X)
- ✅ 통계 아이콘: `lucide-react-native` 표준 (Briefcase/Calendar/Image)
- ✅ Hero 카드 종횡비: 고정 비율(`aspectRatio`) 대신 `minHeight` + 내부 패딩으로 유연하게
- ✅ Hero/Empty 영역을 별도 컴포넌트 파일로 분리 (CLAUDE.md 5조)

## 10. 오픈 이슈

- 도트맵의 우측 영역 제한 시 작은 국가(룩셈부르크, 싱가포르 등)도 잘 보이는지 — 구현 시 시뮬레이터에서 확인하고, 필요 시 `CountryDotMap`에 maxScale prop 등을 추가하거나 padding 조정.
- 다크모드에서 첨부 PNG(밝은 톤) 일러스트가 너무 떠 보이지는 않는지 — 필요 시 opacity 0.7~0.8로 살짝 누름 처리 검토.
