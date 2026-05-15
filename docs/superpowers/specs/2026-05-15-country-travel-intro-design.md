# 안 가본 국가 여행 소개 — 설계

**작성일:** 2026-05-15
**상태:** 설계 승인 대기
**대상 화면:** `src/screens/CountryDetailScreen.tsx`

## 배경 / 목적

지도에서 안 가본 나라의 상세 화면을 열면 현재는 "아직 이 나라의 여행 기록이 없어요" 한 줄만 표시되고 그 아래는 비어 있다. 지도 탐색의 보상이 가본 나라에 한정돼 있고, "다음 여행" 동기를 만드는 루프가 없다.

이 설계는 안 가본 나라의 빈 상태 아래에 "여행을 가볼까요?" 영감 영역을 붙인다. 매거진 톤의 소개 사진 1장과 한 줄 태그라인, 짧은 소개 문단, 들러볼 곳 3개(썸네일 + 이름 + 한 줄)를 보여준다. 가본 나라의 화면은 변경하지 않는다.

## 범위

**포함**
- 인기 상위 10개국 (`popularityRank` 1–10위): FR · ES · US · CN · IT · TR · MX · TH · DE · GB
- 안 가본 국가 상세 진입 시 (`trips.length === 0`)에만 노출
- 10개 지원 언어: ko, en, ja, zh-CN, zh-TW, de, fr, it, es, ru
- 무료 — 구독 게이팅 없음

**제외 (이번 작업 밖)**
- 11개국 이상 확장
- 가본 국가의 다른 안 가본 곳 추천
- 좋아요/저장/공유 액션
- 외부 지도·위키 링크
- A/B 테스트 인프라

## 화면 통합

`CountryDetailScreen.tsx`의 `trips.length === 0` 분기 (현재 line 243–246)를 다음과 같이 바꾼다.

```tsx
) : trips.length === 0 ? (
  <>
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyText}>{t("countryDetail.empty")}</Text>
    </View>
    <IntroSection countryCode={selectedCountry.code} />
  </>
) : ( /* 기존 grouped.map 분기 그대로 */ )}
```

- 기존 0/0/0 통계 카드 + 도트맵 히어로 카드는 **그대로 유지**. 정직한 상태 표시 + 사용자 모델 일관성 + 비어 보이지 않게 분위기를 인트로가 책임.
- 헤더의 편집(✎) 버튼은 기존대로 `!hasTrips && !editMode`일 때 비활성. 인트로 노출과 무관.
- `selectedCountry`가 아직 null인 짧은 순간엔 기존 동작 그대로(빈 root 반환).

## 데이터 레이어

### 위치
앱 번들 내 정적 TS 모듈. **퀄리티 검증 후 Supabase 테이블로 이전 가능** (이전 영향 범위: 아래 "미래 이전" 항목).

### 디렉터리 구조
```
src/data/countryGuides/
├── index.ts          # 공개 API: getCountryGuide(code, locale)
├── types.ts          # CountryGuide, CountryGuideText, CountryImages 타입
├── images.ts         # IMAGES_BY_CODE: code → { hero, highlights[] } (locale-독립)
└── text/
    ├── index.ts      # TEXT_BY_LOCALE: locale → record(code → CountryGuideText)
    ├── ko.ts
    ├── en.ts
    ├── ja.ts
    ├── zh-CN.ts
    ├── zh-TW.ts
    ├── de.ts
    ├── fr.ts
    ├── it.ts
    ├── es.ts
    └── ru.ts
```

### 공개 API

```ts
// src/data/countryGuides/index.ts
export function getCountryGuide(
  code: string,
  locale: SupportedLocale
): CountryGuide | null;
```

- 동기, 인메모리.
- 대상 10개국 → `CountryGuide` 반환.
- 그 외 (또는 알 수 없는 locale) → `null` → `IntroSection`이 아무것도 렌더하지 않음.

### 타입

```ts
type CountryGuide = {
  code: string;
  tagline: string;
  intro: string;
  hero: { url: string; attribution?: string };
  highlights: Array<{
    name: string;
    blurb: string;
    image: { url: string; attribution?: string };
  }>;
};

type CountryGuideText = {
  tagline: string;
  intro: string;
  highlights: Array<{ name: string; blurb: string }>; // 길이 3 고정
};

type CountryImages = {
  hero: { url: string; attribution?: string };
  highlights: Array<{ url: string; attribution?: string }>; // 길이 3 고정
};
```

### 합성 로직
`index.ts`는 `images.ts`(locale-독립)와 `text/<locale>.ts`(locale-종속)를 받아 `CountryGuide`를 합성한다. 이미지가 한 곳에서만 관리되어 텍스트 PR이 이미지 파일을 건드리지 않는다. 텍스트 모듈의 `highlights[i]`는 이미지 모듈의 `highlights[i]`와 인덱스로 짝지어진다.

## UI / 컴포넌트 구조

`CountryDetailScreen.tsx`가 이미 286줄(CLAUDE.md #5의 200줄 경계 초과)이므로 인트로는 별도 폴더로 쪼개서 추가한다.

```
src/screens/CountryDetailScreen/intro/
├── IntroSection.tsx        # 오케스트레이터
├── IntroHero.tsx           # 히어로 사진 + 이름·태그라인 오버레이
├── IntroHighlightRow.tsx   # 하이라이트 1행 (썸네일 + 이름 + 블러브)
└── styles.ts               # 인트로 전용 스타일 (useTheme 기반)
```

### IntroSection
**Props:** `{ countryCode: string }`

```tsx
const guide = getCountryGuide(countryCode, getCurrentLocale());
if (!guide) return null;

return (
  <View style={styles.section}>
    <Text style={styles.ctaHeading}>✈ {t("countryDetail.introCta")}</Text>
    <IntroHero
      url={guide.hero.url}
      attribution={guide.hero.attribution}
      countryCode={guide.code}
      countryName={getCountryName(guide.code, getCurrentLocale())}
      tagline={guide.tagline}
    />
    <Text style={styles.intro}>{guide.intro}</Text>
    <Text style={styles.sectionLabel}>{t("countryDetail.introHighlights")}</Text>
    {guide.highlights.map((h, i) => (
      <IntroHighlightRow key={i} {...h} />
    ))}
  </View>
);
```

### IntroHero
**Props:** `{ url, attribution?, countryCode, countryName, tagline }`

- `<Image source={{ uri }} onError={...} />` 전체 폭, 높이 ~180–200pt
- 어두운 그라데이션 오버레이 위에 좌하단으로 이름(큰 폰트, 굵게) + 태그라인(작은 폰트)
- `attribution` 있으면 우하단에 8–9pt 반투명 텍스트
- **로드 실패 fallback:** `colorForCountry(code)` 그라데이션 + 국기 이모지(50–64pt) + 국가명. 사용자는 빈 박스를 보지 않음 (커밋 `e69ab20 fix(ai-chat): 이미지 로드 실패 시 빈 박스 제거` 패턴과 일관).
- 접근성: `accessibilityLabel={countryName}`로 스크린리더 친화.

### IntroHighlightRow
**Props:** `{ name, blurb, image: { url, attribution? } }`

- 좌측 60×60 둥근 사각형 썸네일 (`<Image onError>`로 실패 시 회색 placeholder + ◆ 아이콘)
- 우측 이름(굵게) + 블러브(회색 작게, 한 줄)
- `attribution` 있으면 행 끝에 8pt 반투명 텍스트
- 행 사이에는 옅은 디바이더 또는 간격(`styles.ts`에서 결정)

### IntroSection의 styles
`useTheme()`을 받아 `makeStyles(theme)`로 생성. 기존 `CountryDetailScreen/styles.ts` 패턴을 따른다. 라이트·다크 모두 자연스럽게 렌더되도록 텍스트 색은 `theme.text` 계열, 배경 분리·테두리는 `theme.line` 계열을 쓴다.

## i18n과 컨텐츠

### UI 크롬 문자열 — i18n JSON
`src/i18n/locales/*.json` 10개 파일 전부의 `countryDetail` 블록에 두 키 추가:

```json
"countryDetail": {
  "empty": "아직 이 나라의 여행 기록이 없어요.",      // 기존
  "introCta": "여행을 가볼까요?",                   // 새
  "introHighlights": "들러볼 곳"                    // 새
}
```

각 언어 화자에게 자연스럽게 의역한다(단순 직역 X). 작업 후 모든 locale JSON이 `JSON.parse` 가능하고 두 신규 키가 10개 파일 전부에 존재함을 확인한다.

### 국가별 가이드 컨텐츠 — 별도 TS 모듈
`src/data/countryGuides/text/<locale>.ts` 10개 파일에 10개국씩 분량의 구조화 데이터.

```ts
// 예: src/data/countryGuides/text/ko.ts
export const TEXT_KO: Record<string, CountryGuideText> = {
  FR: {
    tagline: "예술과 낭만이 흐르는 나라",
    intro: "센강을 따라 늘어선 미술관, 남부의 라벤더 들판, 골목마다 스민 와인과 빵 냄새. 도시와 시골 어디서든 다른 속도의 하루를 선물합니다.",
    highlights: [
      { name: "에펠탑", blurb: "파리의 밤을 밝히는 철의 상징" },
      { name: "몽생미셸", blurb: "바다 위에 떠오른 수도원" },
      { name: "프로방스", blurb: "보랏빛 라벤더가 끝없이 펼쳐진 들판" },
    ],
  },
  // ES, US, CN, IT, TR, MX, TH, DE, GB ...
};
```

### 왜 분리하나
- UI 문자열은 평탄한 키-값 — JSON 적합
- 가이드는 구조화 데이터(객체·배열) + 타입 안전성 필요 — TS 모듈 적합
- 가이드 수정 PR이 UI 문자열 locale 파일을 건드리지 않음 (관심사 분리)

### 컨텐츠 작성 원칙
- **tagline:** 한 줄, 감성적·서사적. 국가 클리셰(예: "자유의 땅") 회피
- **intro:** 2–3문장, 풍경·문화·감각 키워드. 각 언어 자연스러운 길이
- **highlight blurb:** 한 줄, ~20자 내외(언어별 자연 길이 차)
- **정확성:** 위키백과 수준의 기본 사실 검증, 정치적 민감 주제 회피

## 이미지 소싱

### 출처
**Wikimedia Commons만** 사용 — `upload.wikimedia.org/wikipedia/commons/...`
- 라이선스가 페이지에 명시되어 검증 가능
- URL 패턴 안정적
- CDN 무료

### 라이선스 우선순위
1. **CC0 / 퍼블릭 도메인** — `attribution` 생략 (UI 단순)
2. **CC BY 계열** — `attribution` 필수 (`"photo: 작가 / CC BY-SA 4.0"` 형식)

### 큐레이션 절차 (구현 단계)
1. 각 국가의 후보 이미지를 Commons에서 검색 (랜드마크·풍경 위주)
2. 라이선스 페이지 확인, CC0/PD 우선 선택
3. thumb URL 추출 — 히어로 ~800px, 썸네일 ~200px (Commons thumb URL 패턴 `/thumb/.../<width>px-<file>.jpg`)
4. 품질·대표성·앱 톤 일관성 검토
5. URL + (있다면) `attribution` 문자열을 `images.ts`에 기록

### 분량
국가당 4장 (히어로 1 + 하이라이트 3) × 10개국 = **총 40장**.

### 핫링크 리스크와 대응
- 리스크: Commons에서 파일 삭제·이름변경 시 URL 깨질 수 있음
- 대응: `<Image onError>` 핸들러로 fallback (IntroHero / IntroHighlightRow 참조)
- 사용자는 빈 박스를 절대 보지 않음 — 항상 그래픽 + 텍스트가 자리를 채움

## 미래 이전 — Supabase로 옮길 때

**변경 영향 범위:**
- `src/data/countryGuides/index.ts` 한 파일 (인메모리 → fetch)
- `IntroSection.tsx` 호출처 1곳 (동기 → 비동기 + 로딩 처리)

**그대로:**
- 타입, 모든 컴포넌트, 스타일, 로드 실패 fallback, i18n 키

**추가 작업:**
- Supabase 마이그레이션 + 시드 스크립트
- RLS 정책 (읽기 공개)
- 로딩 스켈레톤
- 오프라인 캐싱

이전 트리거: 출시 후 컨텐츠 퀄리티/사용량을 확인하고 결정.

## 검증 계획

**타입체크**
- 10개 텍스트 모듈이 모두 `CountryGuideText` 만족 (컴파일 단계)
- `IMAGES_BY_CODE[code].highlights` 길이가 3 (텍스트의 highlights와 짝)

**시뮬레이터 시각 확인**
- 10개 대상 국가 상세 화면 진입 → 인트로 노출 (히어로·태그라인·인트로 문단·들러볼 곳 3행)
- 대상 외 안 가본 국가 (예: NO 노르웨이) 진입 → 인트로 미노출, 기존 빈 상태 그대로
- locale 설정 ko, en 최소 2개에서 텍스트·이미지 정상 렌더
- 가본 국가는 변경 없음 (regression 없음)

**로드 실패 fallback**
- 임시로 잘못된 hero URL을 한 국가에 주입 → 그라데이션 + 국기 + 국가명 fallback이 깨진 박스 없이 자연스럽게 렌더되는지 확인 → 원복

**locale JSON**
- 모든 `src/i18n/locales/*.json` 파일이 `JSON.parse` 가능
- `countryDetail.introCta`, `countryDetail.introHighlights` 두 키가 10개 파일 전부에 존재

## 작업 분량 추정

- **텍스트 컨텐츠:** 10개국 × 10언어 × (~100–150 단어/국가/언어) ≈ 1만 단어 안팎
- **이미지 큐레이션:** 40장 (라이선스 검증 포함)
- **코드:**
  - 새 파일 — `intro/` 4개 + `countryGuides/` ~13개(`index`/`types`/`images` + `text/index` + 10개 locale 텍스트)
  - 기존 파일 수정 — `CountryDetailScreen.tsx` 4줄 + 10개 locale JSON 키 2개씩 추가
