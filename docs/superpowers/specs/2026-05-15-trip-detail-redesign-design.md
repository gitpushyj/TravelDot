# 여행 상세 페이지(TripDetailScreen) 리디자인

## 배경
현재 [TripDetailScreen](../../../src/screens/TripDetailScreen.tsx)는 hero 카드에 도트맵 + 숫자 배지(N일/N장)만 띄우고, "여행 기간"은 단순 텍스트 섹션이다. 화면 정체성이 약하고 카드와 본문의 위계가 흐릿하다는 피드백을 반영해, 카드에 국가 이름·코드·도트맵을 함께 배치하고 정보 카드(여행 기간)를 분리한다.

## 목표
- 헤더 타이틀에 **여행 일자**를 표시 (현재의 국가명/코드 자리)
- Hero 카드에 좌(국가명·코드) + 우(도트맵) 2단 + 하단 흰색 미니카드(여행/사진) 구성
- "여행 기간"을 단순 텍스트가 아닌 **캘린더 아이콘 카드**로 승격
- 사진/노트 섹션은 변경 없음

## 디자인 결정

### 헤더
| 영역 | 내용 |
| --- | --- |
| 좌 | 뒤로가기 (변경 없음) |
| 중앙 | 🇯🇵 + `2026.05.13 – 05.14` (국기 이모지 + `formatTripDateRange` 결과) |
| 우 | "✎ 수정" (변경 없음) |

기존 `headerCenter`의 `koName + countryCode`는 제거.

### Hero 카드
- 배경: `colorForCountry(code).bg` (변경 없음)
- 라운드: 24px (변경 없음)
- 내부 구조: 좌측 컬럼 / 우측 컬럼 / 하단 미니카드 행
- 좌측 컬럼 (`flex` 1로 배치, 패딩 20):
  - "일본" — 흰색, `fontSize 40`, `fontWeight 800` (locale에 따른 국가명)
  - "JP" — `rgba(255,255,255,0.6)`, `fontSize 18`, `fontWeight 700`
- 우측 컬럼 (`flex` ~1.1):
  - `CountryDotMap` 컨테이너. 도트 색은 기존 `colorForCountry(code).dot` 그대로
- 하단 미니카드 행 (`flexDirection: row`, `gap: 10`):
  - 미니카드: 흰색 배경 (`rgba(255,255,255,0.95)`), 라운드 14px, 패딩 12·14
  - 좌측: 빨간 SVG 아이콘 (가방 / 사진 프레임)
  - 우측: 숫자(`fontSize 22`, `800`) + 단위("일"/"장", `fontSize 13`, `700`) — 한 줄, 그 아래 라벨("여행"/"사진", `fontSize 11`, `600`, 회색)
- 카드 전체는 `Pressable` 유지 → `onSelectCountry`

미니카드 자체는 별도 누름 영역으로 처리하지 않는다 — 부모 Pressable이 그대로 받는다.

### 여행 기간 카드 (신규)
| 영역 | 내용 |
| --- | --- |
| 좌 (48×48 원) | 옅은 빨강 배경 (`rgba(국가색, 0.08)`) + 빨간 캘린더 SVG |
| 우 상단 | "여행 기간" — `theme.textSecondary`, `fontSize 12`, `fontWeight 600` |
| 우 하단 | 큰 검정 일자 + 회색 "(2일)" — 같은 줄, baseline 정렬 |

흰색 카드 (`theme.cardBg`), 라운드 16, 패딩 18, 보더 `theme.cardBorder`.

### 사진 / 노트 섹션
변경 없음.

## 신규 자산

### SVG 아이콘 (자체 컴포넌트)
프로젝트 컨벤션을 따라 `src/screens/TripDetailScreen/icons.tsx`에 함께 정의:
- `BagIcon` — 가방 실루엣
- `PhotoFrameIcon` — 사진 프레임 (이미지 산 아이콘)
- `CalendarIcon` — 캘린더 (날짜 그리드)

모두 stroke/fill 컬러를 prop으로 받는 단순 컴포넌트.

### i18n 키 (10개 locale 모두)
새로 추가:
- `tripDetail.miniDayLabel` — "여행"
- `tripDetail.miniDayUnit` — "일"
- `tripDetail.miniPhotoLabel` — "사진"
- `tripDetail.miniPhotoUnit` — "장"

기존 `tripDetail.dayUnit` / `tripDetail.photoUnit`은 다른 사용처가 없으면 제거. (사용처 확인 필요)

`tripDetail.sectionDates` ("여행 기간")는 그대로 재사용. 날짜 + "(N일)" 표기는 기존 `formatTripDateRange` + `common.daysSuffix` 조합 유지하되, `daysSuffix`를 괄호로 감싸는 방식이 다른 화면과 충돌하지 않는다면 카드 안에서만 `(${daysSuffix})` 처리.

## 파일 분리 (CLAUDE.md §5)
Hero 카드 내부 구조가 커지므로 컴포넌트와 스타일을 분리:
- `src/screens/TripDetailScreen.tsx` — 상위 화면 로직 (그대로)
- `src/screens/TripDetailScreen/HeroCard.tsx` — 새로 분리 (좌측 텍스트 / 우측 도트맵 / 하단 미니카드)
- `src/screens/TripDetailScreen/DateRangeCard.tsx` — 새로 분리 (캘린더 아이콘 + 라벨 + 일자)
- `src/screens/TripDetailScreen/icons.tsx` — SVG 아이콘 3종
- `src/screens/TripDetailScreen/styles.ts` — 기존 스타일에서 사용 안 하는 키 제거, 새 카드용 스타일 추가

## 인터랙션
- Hero 카드 누름 → 기존과 동일: `onSelectCountry()` → 국가 상세 페이지로 이동
- 여행 기간 카드는 누름 영역 없음
- 미니카드는 별도 핸들러 없음

## 다크 모드
- Hero 카드: 국가색 그대로 (이미 어두운 톤)
- 미니카드 흰색 배경: 그대로 (빨간 배경 위에 떠 있는 의도)
- 여행 기간 카드: `theme.cardBg` + `theme.cardBorder` → 라이트/다크 자동 대응
- 캘린더 아이콘 배경 원: `colorForCountry(code).bg`의 알파 8%로 라이트/다크 모두 자연스럽게 표시

## 스코프 외
- 노트 카드 디자인 변경 없음
- 사진 미리보기 카드 디자인 변경 없음
- `CountryDetailScreen` 등 다른 화면 변경 없음
- `EditTripScreen`은 별도 화면이므로 영향 없음
