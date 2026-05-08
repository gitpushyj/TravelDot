# 홈 지도 공유 카드 디자인

날짜: 2026-05-08
대상 화면: `src/screens/MainScreen/index.tsx`
워터마크: **TravelDot**

## 1. 목적

홈 화면의 도트 지도와 사용자의 호칭/통계를 한 장의 이미지(9:16)로 SNS(인스타 스토리/쓰레드/X 등)에 공유할 수 있게 한다. 인스타·쓰레드·X 등 어떤 채널을 쓸지는 OS 공유 시트로 위임한다.

## 2. 사용자 흐름

1. 홈 화면 지도 카드 **하단 우측**에 두 버튼이 나란히 노출된다: 공유(↗), 풀화면(⛶).
2. 공유 버튼 탭 → **공유 미리보기 모달**이 화면을 덮으며 열린다.
3. 모달 안에 9:16 카드 미리보기가 표시된다. 하단에 `[닫기]` `[저장]` `[공유]` 세 버튼.
4. 동작 분기:
   - `[공유]` → 카드를 PNG(1080×1920)로 캡처 → `expo-sharing`이 OS 공유 시트를 호출. 사용자가 인스타 스토리/쓰레드/X/저장 등을 선택.
   - `[저장]` → 동일 PNG를 캡처해 `expo-media-library`로 카메라롤(사진 라이브러리)에 직접 저장. 성공 시 짧은 확인 토스트("사진에 저장됨"). OS 시트를 거치지 않는다.
   - `[닫기]` → 모달 종료.
5. 어느 버튼을 눌러도 모달은 그대로 유지(연속 공유/저장 가능). `[닫기]`로만 종료.

## 3. 카드 구성 (9:16, 1080×1920)

```
┌──────────────────────┐
│                      │
│       🌍 세계인       │   활성 뱃지(호칭)
│      42국 · 187일     │   통계
│       2018 ~ 2024     │   연도 라벨
│                      │
│ ┌──────────────────┐ │
│ │   풀샷 도트 지도   │ │   가로 직사각, 줌 1.0, pan 0,0
│ └──────────────────┘ │
│                      │
│       · TravelDot ·   │   워터마크
└──────────────────────┘
```

### 데이터 매핑

- **활성 뱃지(호칭)**: `pickActiveBadge(activeBadgeId, "tier_<id>", BADGE_KO_NAMES)` → `emoji + localizedBadgeTitle(...)` (현재 홈 헤더와 동일 로직).
- **국가 수 / 일수**: `totals.countries`, `totals.days` (현재 홈에서 쓰는 `activeCounts` 기반 계산을 그대로 재사용).
- **연도 라벨**:
  - `yearMode.kind === "year"` → `"YYYY"`
  - `yearMode.kind === "all"` → `availableYears`로부터:
    - 길이 0 → 라벨 미표시(공백 처리, fallback 텍스트 없음)
    - 길이 1 → `"YYYY"`
    - 길이 ≥ 2 → `"<min> ~ <max>"`
- **지도**: `DotMap`을 `visitCounts={activeCounts}` `enableZoom={false}` `playIntro={false}`로 정적 풀샷 렌더. 가로 슬롯 폭 1080 - 좌우 패딩(각 60), 높이는 `dotData`의 자연 비율(360 : `maxLat-minLat`)대로 계산.
- **워터마크**: 텍스트 `TravelDot`. 폰트 굵기 700, 색상은 카드 배경에 맞춰 텍스트 secondary.

### 테마

카드 배경/텍스트는 **앱 현재 테마(라이트/다크)를 그대로 따라간다**. 별도 강제 테마 없음. (v2에서 옵션 추가 가능)

### 카드 비-목표 (MVP에서 빼는 것)

- 마일스톤 진행도 (자랑 콘텐츠 동기 약화)
- 최근 방문 국기 칩 (도트 지도와 정보 중복)
- 1:1 / 4:5 비율 옵션
- "전체/내 영역" 자동 프레이밍 토글
- 카드 색상/스타일 변형

## 4. 홈 화면 변경

### 새 액션 row 추가

`mapStatsCard` 내부, `mapWrap` 아래에 `mapActions` row를 추가한다(지도 영역 **밖**, 카드 **안**).

```
┌────────────────────────────┐
│ 🌍 세계인   42국·187일      │  헤더
│ [전체] [2024]               │
│ ─────────────────────────── │
│                             │
│       [도트 지도]            │  mapArea (UI 깔끔)
│                             │
│       〰〰 (리사이즈)        │  mapResizeZone
│                  [ ↗ ][ ⛶ ]│  새 mapActions row
└────────────────────────────┘
```

- `flexDirection: "row"`, `justifyContent: "flex-end"`, `alignItems: "center"`
- `paddingHorizontal: 16`, `paddingTop: 4`, `paddingBottom: 12`, `gap: 8`
- 두 버튼은 동일한 시각 톤(원형/캡슐 32×32, `cardBg` 배경, 1px `cardBorder`, 그림자 약하게)
- 아이콘: 공유 `↗`, 풀화면 `⛶` (기존과 동일)

### 기존 ⛶ 제거

`MainScreen/index.tsx:435-444`의 `mapFloatingBtn`(`absolute, left:12, top:12`)을 제거하고, 동일 동작(`navigation.navigate("MapZoom")`)을 새 row의 풀화면 버튼으로 옮긴다. `styles.ts`의 `mapFloatingBtn*` 스타일은 새 row 스타일로 대체.

## 5. 캡처/공유 기술

### 의존성

- 추가: `react-native-view-shot` (Expo 호환, iOS/Android 모두 지원, RN 0.81 호환)
- 추가: `expo-sharing` (OS 공유 시트)
- 사용 중(재활용): `@shopify/react-native-skia`(지도), `expo-media-library`(카메라롤 저장 — 사진 동기화 기능에서 이미 권한·런타임 흐름 사용 중)

```
expo install expo-sharing
npm i react-native-view-shot
```

### 캡처 방식

- 모달 내부에 카드 컨테이너를 **항상 1080×1920 layout으로 렌더**한다.
- 화면 표시는 `transform: [{ scale }]`로 축소(예: 화면 폭이 360이라면 scale ≈ `(screenWidth - 32) / 1080`).
- `captureRef(ref, { format: "png", quality: 1, result: "tmpfile", width: 1080, height: 1920 })`로 PNG 파일 URI를 얻는다.
- 공유: 결과 URI를 `Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: t("share.dialogTitle") })`에 전달.
- 저장: 결과 URI를 `MediaLibrary.saveToLibraryAsync(uri)` 또는 `createAssetAsync(uri)`로 카메라롤에 저장.
  - iOS: `requestPermissionsAsync({ writeOnly: true })`로 쓰기 전용 권한 요청. `Info.plist`의 `NSPhotoLibraryAddUsageDescription`은 사진 동기화에서 이미 설정되어 있으므로 추가 설정 불필요.
  - Android: 사진 동기화로 이미 받은 권한이 있으면 재사용. 거부 상태면 동일 권한 요청 흐름을 거친다.

### 사용 가능 여부 폴백

- `Sharing.isAvailableAsync()` false → `Alert.alert`로 안내(이 경로가 막힌 일부 환경 대응).
- `MediaLibrary` 권한 거부 → 알림으로 설정 진입 안내(`share.permissionDenied`).

## 6. 컴포넌트/파일 구조

CLAUDE.md §5(파일 분리) 원칙에 맞춰 책임 단위로 쪼갠다.

```
src/features/share/
  ShareMapCard.tsx          # 9:16 카드 UI (호칭/통계/연도/지도/워터마크)
  ShareMapCard.styles.ts    # 카드 스타일 (테마 기반)
  ShareMapModal.tsx         # 미리보기 모달 + 닫기/저장/공유 버튼 + 토스트
  yearLabel.ts              # yearMode + availableYears → 라벨 문자열 (순수 함수)
  shareMapImage.ts          # captureRef 래퍼 + shareImage(uri) + saveImageToLibrary(uri)

src/screens/MainScreen/
  MapActions.tsx            # 카드 하단 우측 액션 row(공유, 풀화면)
  index.tsx                 # 액션 row 연결, 모달 상태 관리
  styles.ts                 # mapActions 스타일 추가, mapFloatingBtn 계열 정리
```

각 파일은 200줄 이하 유지. 모달의 카드 미리보기는 `ShareMapCard`를 그대로 재사용한다.

## 7. i18n

영어/한국어 키 추가(현재 사용 중인 i18n 구조에 맞춰):

- `home.shareBtnA11y` — 공유 버튼 접근성 라벨
- `share.dialogTitle` — OS 공유 시트 다이얼로그 제목 ("내 여행 지도 공유하기")
- `share.previewTitle` — 모달 헤더 ("지도 공유")
- `share.confirm` — `[공유]` 버튼
- `share.save` — `[저장]` 버튼
- `share.cancel` — `[닫기]` 버튼
- `share.savedToast` — 저장 완료 토스트("사진에 저장됨")
- `share.captureFailed` — 캡처 실패 알림
- `share.saveFailed` — 저장 실패 알림
- `share.notAvailable` — 공유 불가 알림
- `share.permissionDenied` — 사진 라이브러리 권한 거부 시 안내

워터마크 `TravelDot`은 제품명이라 번역 대상이 아님.

## 8. 에지케이스

| 상황 | 동작 |
| --- | --- |
| `availableYears` 비어있고 `yearMode.kind === "all"` | 연도 라벨 줄을 비워둠(공백 라인 유지로 레이아웃 점프 없음) |
| `homeCountry` 미설정 | 홈 화면 자체가 렌더되지 않음 → 무시 |
| 캡처 실패(`captureRef` reject) | 모달 안 토스트 + `[다시 시도]` 버튼 |
| 공유 시트 사용 불가 | `share.notAvailable` 알림 |
| 저장 권한 거부 | `share.permissionDenied` 알림(설정 화면 진입 안내) |
| 저장 실패(쓰기 에러) | `share.saveFailed` 토스트 |
| 저장 성공 | `share.savedToast` 짧은 토스트(2초) |
| DotMap 인트로/줌 | `playIntro={false}, enableZoom={false}`로 정적 1.0 스케일 풀샷 |
| 라이트/다크 전환 | 카드와 미리보기 모두 현재 테마를 그대로 사용 |
| 다이내믹 폰트(시스템 큰글씨) | 9:16 카드 텍스트는 절대 폰트 사이즈로 고정 — 시스템 스케일 영향 받지 않게 |

## 9. 분석 추적 (`src/lib/tracking.ts`)

이벤트 추가:

- `share_button_tap` — 홈 카드 하단 공유 버튼 탭
- `share_preview_open` — 미리보기 모달 표시
- `share_sheet_open` — OS 공유 시트 호출 성공
- `share_save_to_library` — 카메라롤 저장 성공
- `share_capture_failed` — 캡처 실패
- `share_save_failed` — 저장 실패(권한 또는 쓰기 에러)

## 10. 향후(v2)

- "전체 지도 / 방문 영역만(auto-fit)" 토글
- 정사각(1:1) / 4:5 비율 옵션
- 카드 테마 강제 옵션(다크 고정)
- 마일스톤·국기 칩 등 추가 정보 토글
- 공유 후 인앱 보상(공유 횟수 뱃지 등)

## 11. 작업 분리(구현 단계 입력)

1. `expo-sharing`/`react-native-view-shot` 의존성 추가 및 iOS/Android 빌드 확인
2. `yearLabel.ts` 순수 함수 + 단위 테스트
3. `ShareMapCard.tsx` (1080×1920 layout, 정적 DotMap)
4. `shareMapImage.ts` (captureRef + `shareImage`/`saveImageToLibrary` 래퍼, 권한 처리 포함)
5. `ShareMapModal.tsx` (미리보기 + 닫기/저장/공유 + 토스트 + 에러 폴백)
6. `MapActions.tsx` 추가, `MainScreen/index.tsx`에서 기존 `mapFloatingBtn` 제거 및 새 row 연결
7. i18n 키 추가
8. 분석 이벤트 연결
9. 라이트/다크 양 테마 + 빈 데이터/단일 연도/다년도 시나리오 수동 검증
