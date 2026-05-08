# 유료 전용 숨겨진 마일스톤 — 디자인 문서

> 유료 전환 동기 부여 + 기존 게이미피케이션 레이어 확장. 나이 기반 시간 도전 + 시간 패턴 + 문화/시각 + 점유율 + 시차 — 5개 카테고리 균형형으로 10개 마일스톤(약 30+ 호칭)을 추가한다.

---

## 1. 목적과 범위

### 1.1 목적

- **유료 전환 동기**: 무료 사용자는 마일스톤 화면에서 "🔒 N개 잠금" 실루엣으로 존재만 인지. 결제 후 잠금 해제 + 진행률 표시.
- **기존 시스템 확장**: 현재 마일스톤(`countries`, `days`, 대륙 5종 = 7개)과 동일한 추적 모델을 따르되, 별도 그룹("Premium")으로 노출.
- **나이/성별 데이터 활용**: 온보딩에서 받는 `birthYear`를 컷오프 기준으로 활용. 성별은 이번 v1에서 활용하지 않음 (호칭 분기 단조롭다고 사용자 판단).

### 1.2 범위 (v1)

- 마일스톤 카탈로그 정의 (10개)
- 마일스톤 평가 함수 확장 — 사진 메타데이터·정적 매핑 활용
- 정적 매핑 데이터 5종 추가 (인구·면적·국기색·공용어·UTC offset)
- 호칭 카탈로그(badges) 확장 — 30+ 신규 호칭
- 무료/유료 가시성 정책 — 마일스톤 탭은 이름·설명까지 노출, 호칭 탭은 자물쇠로 가림 (§4)

### 1.3 비범위 (v1 제외)

- **좌표 기반 마일스톤** (반구·지구의 5선·고도) — `visit_photos`에 lat/lng/altitude 컬럼 없음. 마이그레이션 + EXIF 재추출 부담 → v2 이후.
- **결제 시스템(IAP) 자체** — 본 문서는 "유료 사용자라면 보인다" 게이팅의 *클라이언트 표현*만 다룬다. 결제 백엔드/IAP 통합은 별도 워크.
- **연도 정복·첫 출국·연속 방문 등 §4.3.7 풀** — 사용자가 v1 우선순위에서 제외.

---

## 2. 마일스톤 카탈로그 (10개)

### A. 나이 기반 (3개) — `birthYear` + photo `taken_at`

#### A1. N Before N — 속도 도전 ★회고 보존
**유형:** 다단계 단일 마일스톤 카드
**평가:** 사진 EXIF `taken_at` 기준 "촬영 당시 만 나이"가 N 미만인 시점에 누적 방문국 수가 M 도달
**컷오프 / 호칭:**

| 단계 | 조건 | 호칭 KR | 호칭 EN |
|---|---|---|---|
| 1 | 만 20세 전 5개국 | 조숙한 발자국 | 5 Before 20 |
| 2 | 만 25세 전 10개국 | 이른 노마드 | 10 Before 25 |
| 3 | 만 30세 전 20개국 | 서른 전의 세계 | 20 Before 30 |
| 4 | 만 40세 전 30개국 | 불혹의 컬렉터 | 30 Before 40 |
| 5 | 만 50세 전 50개국 | 반세기 컬렉터 | 50 Before 50 |

**핵심 메커니즘:** 한 번 달성하면 영구. 만 30세를 지나서 20개국에 도달해도 단계 3은 잠금 해제되지 않음 → 시간 압박이 호칭의 가치.

**컷오프 강도 근거:** 결제자 대부분이 적어도 1~2단계는 회고적으로 받을 수 있도록 의도. 만 50세 전 50국은 T10(상위 1%) 진입선과 일치해 평생 적극 여행자의 도달선.

#### A2. 인생 단계별 도장 (Decade Stamps) ★회고 보존
**유형:** 다단계 단일 마일스톤 카드 — 평생 컬렉션
**평가:** 사진 `taken_at`이 사용자의 만 [10s, 20s, 30s, 40s, 50+] 구간에 해당하는 사진들의 고유 국가 수
**컷오프 / 호칭:**

| 단계 | 조건 | 호칭 KR | 호칭 EN |
|---|---|---|---|
| 1 | 10대에 5개국 | 유년의 발자취 | Childhood Wanderer |
| 2 | 20대에 15개국 | 청춘의 방랑 | Roaring Twenties |
| 3 | 30대에 25개국 | 삼십대의 컬렉터 | Thirty-Something Collector |
| 4 | 40대에 25개국 | 불혹의 떠돌이 | Forty Forward |
| 5 | 50대 이후 신규 15개국 | 제2의 출발선 | Late Bloomer |

**핵심 메커니즘:** 각 단계는 그 연령대를 지나는 동안만 채울 수 있음. 한 사용자가 여러 단계를 모두 보유 가능 (50대까지 살면서 모두 채운 사람 = 5개 호칭 보유).

#### A3. 내 나이만큼의 발자취 (My Age in Countries)
**유형:** 다단계 단일 카드 — 동적
**평가:** 누적 방문국 수 vs 현재 만 나이
**컷오프 / 호칭:**

| 단계 | 조건 | 호칭 KR | 호칭 EN |
|---|---|---|---|
| 1 | 국가 수 ≥ 만 나이 | 동갑 수집가 | Age-Matched Traveler |
| 2 | 국가 수 ≥ 만 나이 × 1.5 | 초과달성 | Beyond Years |
| 3 | 국가 수 ≥ 만 나이 × 2 | 두 배의 인생 | Double-Aged |

**핵심 메커니즘:** 매년 생일에 자동으로 컷오프가 올라가는 동적 챌린지. 한 번 달성해도 다음 해에 더 가야 유지(잠금 해제는 영구지만, 도전 이어짐).

---

### C. 시간 패턴 (2개) — photo `taken_at`만 활용

#### C1. 사계절 컬렉터 (Four Seasons in One Place)
**유형:** 동적 마일스톤 — 국가별 인스턴스
**평가:** 한 해외 국가에서 봄(3-5월) / 여름(6-8월) / 가을(9-11월) / 겨울(12-2월) 각 1장 이상 (남반구는 v1에서 단순 처리 — 북반구 기준 월 매핑)
**컷오프 / 호칭:**

| 조건 | 호칭 KR | 호칭 EN |
|---|---|---|
| 한 해외 국가 4계절 모두 | (국가) 사계절 | (Country) Four Seasons |

- 본국 제외 (자동 충족 위험 차단)
- 동적: 충족된 모든 국가에 대해 호칭 발급. ID: `seasons_<code>`

#### C2. 달력의 여행자 (Calendar Drifter)
**유형:** 다단계 단일 카드
**평가:** 1~12월 각 월에 해외 사진 1장 이상인 월 개수
**컷오프 / 호칭:**

| 단계 | 조건 | 호칭 KR | 호칭 EN |
|---|---|---|---|
| 1 | 6개월 (어떤 6개월이든) | 반년의 여행자 | Half-Year Drifter |
| 2 | 12개월 모두 | 달력의 여행자 | Calendar Drifter |

---

### D. 문화·시각 (2개) — 정적 매핑

#### D1. 국기 팔레트 마스터 (Flag Palette Master)
**유형:** 다단계 단일 카드
**평가:** 방문국 국기에 사용된 주요 색상의 합집합. 정적 매핑 `flag_colors.json` (국가 → ["red","blue", ...])
**기준 색상 7종:** red / orange / yellow / green / blue / black / white
**컷오프 / 호칭:**

| 단계 | 조건 | 호칭 KR | 호칭 EN |
|---|---|---|---|
| 1 | 5색 | 색의 수집가 | Color Collector |
| 2 | 7색 모두 | 팔레트 마스터 | Flag Palette Master |

UI: 국기 색 도트 7개 그리드로 진행률 시각화.

**색 분류 원칙:** 메탈릭(금/은)은 노랑/흰색에 통합. 코발트·네이비·하늘색은 모두 blue로 정규화. 분류 모호 케이스는 `flag_colors.json` 작성 시 일괄 결정.

#### D2. UN 공용어 정복 (UN Linguist)
**유형:** 다단계 단일 카드
**평가:** UN 6공용어(영어·중국어·스페인어·프랑스어·러시아어·아랍어) 각각이 공용어인 국가 1개 이상 방문. 정적 매핑 `official_languages.json`
**컷오프 / 호칭:**

| 단계 | 조건 | 호칭 KR | 호칭 EN |
|---|---|---|---|
| 1 | 3개 공용어 | 3개 국어의 여행자 | Trilingual Traveler |
| 2 | 6개 모두 | UN 공용어 정복자 | UN Linguist |

---

### E. 점유율 (2개) — 정적 매핑

#### E1. 인류의 X (Humanity's X)
**유형:** 다단계 단일 카드
**평가:** Σ(방문국 인구) / 세계 인구. 정적 매핑 `population.json` (UN 2023 기준)
**컷오프 / 호칭:**

| 단계 | 조건 | 호칭 KR | 호칭 EN |
|---|---|---|---|
| 1 | ≥ 25% | 인류의 4분의 1 | Quarter of Humanity |
| 2 | ≥ 50% | 인류의 절반 | Half of Humanity |
| 3 | ≥ 75% | 인류의 4분의 3 | Three-Quarters of Humanity |

#### E2. 지구의 X (Earth's X)
**유형:** 다단계 단일 카드
**평가:** Σ(방문국 면적) / 지구 육지 총면적(약 148.94M km²). 정적 매핑 `area.json`
**컷오프 / 호칭:**

| 단계 | 조건 | 호칭 KR | 호칭 EN |
|---|---|---|---|
| 1 | ≥ 25% | 지구의 4분의 1 | Quarter of Earth |
| 2 | ≥ 50% | 지구의 절반 | Half of Earth |
| 3 | ≥ 75% | 지구의 4분의 3 | Three-Quarters of Earth |

---

### B. 시차 (1개) — 정적 매핑

#### B3. 지구 한 바퀴 (Round the Clock)
**유형:** 단일 단계 카드
**평가:** 방문국 중 UTC offset 차이가 24시간 이상인 두 국가 모두 방문. 정적 매핑 `utc_offset.json` (가장 큰 도시 기준)
**컷오프 / 호칭:**

| 조건 | 호칭 KR | 호칭 EN |
|---|---|---|
| UTC-12 ~ UTC+14 사이 24h 이상 차 두 국가 | 지구 한 바퀴 | Round the Clock |

예시 충족 조합: 미국(서부 UTC-8) + 뉴질랜드(UTC+12) 차이 20h → 미달. 사모아(UTC-11) + 키리바시(UTC+14) 차이 25h → 충족. 24h 이상 컷오프는 도전적이라 호칭 가치 큼.

---

## 3. 데이터 모델

### 3.1 마일스톤 종류 확장

```typescript
// src/features/milestone/milestoneTypes.ts
export type PremiumMilestoneId =
  | "premium_n_before_n"
  | "premium_decade_stamps"
  | "premium_age_match"
  | "premium_four_seasons"     // 동적: 국가별 인스턴스 → 카드는 진행률 합쳐서 표시
  | "premium_calendar"
  | "premium_flag_palette"
  | "premium_un_linguist"
  | "premium_humanity"
  | "premium_earth_area"
  | "premium_round_the_clock";

export type MilestoneKind =
  | "countries"
  | "days"
  | ContinentMilestoneId
  | PremiumMilestoneId;
```

`ALL_MILESTONE_KINDS`는 기본 7개 그대로. 신규 `PREMIUM_MILESTONE_KINDS` 별도 배열로 분리 — 무료 사용자에게 노출되지 않도록.

### 3.2 정적 매핑 데이터 (신규)

`src/features/badges/data/` 디렉터리 (신규):

| 파일 | 형식 | 크기 추정 |
|---|---|---|
| `population.json` | `Record<string, number>` (국가코드 → 명) | 215 × ~10B = ~3KB |
| `area.json` | `Record<string, number>` (km²) | ~3KB |
| `flag_colors.json` | `Record<string, string[]>` | ~6KB |
| `official_languages.json` | `Record<string, string[]>` | ~6KB |
| `utc_offset.json` | `Record<string, number>` (시간, 소수 가능) | ~3KB |

**총 ~21KB.** 빌드 번들에 포함해도 무시 가능.

데이터 출처는 디자인 문서 §5.5에 명시.

### 3.3 호칭(Badge) 카탈로그 확장

`badges.ts`에 신규 카테고리 추가:

```typescript
export type BadgeCategory =
  | "tier" | "days" | "continent" | "country" | "foreign"
  | "premium_age"      // A1, A2, A3
  | "premium_time"     // C1, C2
  | "premium_culture"  // D1, D2
  | "premium_share"    // E1, E2
  | "premium_special"; // B3
```

각 마일스톤의 단계마다 `BadgeDefinition` emit.
- ID 컨벤션: `pn_before_n_30`, `pdecade_20s`, `page_match_x2`, `pseasons_<code>`, `pcalendar_12`, `pflag_8`, `pun_lang_6`, `phumanity_50`, `pearth_50`, `pround_clock`

기존 `evaluateBadges` 함수 시그니처 확장:

```typescript
export function evaluateBadges(
  stats: BadgeStats,
  countryNameByCode: Record<string, string>,
  premiumContext?: PremiumContext, // 유료 사용자만 전달
): BadgeDefinition[];

type PremiumContext = {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  homeCountry: string | null;
  visitedCountriesByDecade: Record<DecadeBin, Set<string>>;  // 사진 EXIF 분석 결과
  earliestCountryAtAge: Record<number, Set<string>>;         // age → countries reached at that age
  monthsActive: Set<number>;        // 1-12
  seasonsByCountry: Record<string, Set<Season>>;
};
```

### 3.4 사용자 결제 상태 (임시)

v1에서는 백엔드 결제가 없으므로 dev flag로 토글:

```typescript
// src/features/auth/profileStore.ts (또는 별도 entitlementStore)
export type Entitlement = {
  isPremium: boolean;
  premiumSince?: number;  // epoch ms
};
```

`isPremium`을 어디에 저장하느냐는 결제 시스템 구현 시 결정. v1에선 Settings 화면에 dev 전용 토글 또는 supabase 사용자 컬럼.

---

## 4. UI/UX — 무료 vs 유료 가시성

핵심 원칙은 **두 화면에서 서로 다른 노출 강도**를 갖는다는 것:

- **마일스톤 화면** = "도전할 거리 미리보기". 무료 사용자도 이름·아이콘·설명까지 다 보임 → 결제 동기 부여. 진행률·세부 단계·호칭만 가려진다.
- **호칭 화면** = "잠금 해제의 보상". 무료 사용자에게는 호칭 자체가 자물쇠로 가려진다 → 결제 후 발견의 즐거움.

### 4.1 MilestonesScreen — 마일스톤 탭

#### 4.1.1 무료 사용자 화면

```
┌─ 기본 마일스톤 ─────────┐
│ ● 다음 등급             │  (활성 표시)
│ ○ 누적 일수             │
│ ○ 아시아                │
│ ...                     │
└─────────────────────────┘

┌─ 🔒 Premium 마일스톤 ───────────────────────┐
│  유료 결제자에게 제공되는 마일스톤 (10)        │
│ ─────────────────────────────────────────── │
│ 🏃  N Before N                  🔒          │
│     "정해진 나이에 도달하기 전까지의           │
│      여행 기록을 모은다"                       │
│                                              │
│ 📅  인생 단계별 도장             🔒          │
│     "10대·20대·30대… 인생 시기마다             │
│      찍어둔 발자취를 컬렉션으로"               │
│                                              │
│ 🌸  사계절 컬렉터                🔒          │
│     "한 나라에서 봄·여름·가을·겨울             │
│      모두를 사진에 담는다"                     │
│                                              │
│ ...(7개 더)                                   │
│                                              │
│        [Premium 알아보기 →]                  │
└──────────────────────────────────────────────┘
```

**보이는 것 (무료):**
- 마일스톤 그룹 헤더 ("유료 결제자에게 제공되는 마일스톤") + 자물쇠 아이콘
- 각 마일스톤의 **아이콘 / 이름 / 한 줄 설명** 모두 노출
- 카드 우측에 자물쇠 아이콘

**가려지는 것 (무료):**
- 진행률 바 / 현재 값
- 단계별 호칭 ("30 Before 30" 같은 구체 호칭명은 노출 X)
- 세부 컷오프 숫자 (개수·연령)
- 다음 잠금 해제까지의 거리

**탭 시:** 결제 안내 모달 → "이 마일스톤은 Premium 가입 후 추적 가능합니다" + 가입 CTA.

#### 4.1.2 유료 사용자 화면

```
┌─ Premium 마일스톤 ──────────────────────────┐
│ ● N Before N · 30 Before 30      ●●●○      │ (20국 / 30국, 만 28세)
│ ○ 인생 단계별 도장 · 30대의 컬렉터 ●●●●○    │
│ ○ 사계절 컬렉터 · 일본의 사계절   ●●●●  ✓  │
│ ...                                          │
└──────────────────────────────────────────────┘
```

- 일반 마일스톤과 동일한 진행률 UI + 라디오 선택으로 홈 화면 트래커 지정
- 동적 마일스톤(C1 사계절)은 "가장 많이 채운 국가"를 대표로 표시. 상세 클릭 시 모든 국가 진행률
- A1·A2 회고 보존 호칭은 "달성 가능한 다음 단계"를 대표로 표시 (만 50세를 넘긴 사용자에게는 "더 이상 도전 불가" 표기 + 이미 받은 회고 호칭들 노출)

### 4.2 TitlesScreen — 호칭 탭

#### 4.2.1 무료 사용자 화면

기존 카테고리(`tier`, `days`, `continent`, `country`, `foreign`)는 그대로. 마지막에 신규 5개 Premium 카테고리 추가, 단 모두 잠금:

```
┌─ 호칭 ───────────────────────────────────────┐
│                                              │
│  [등급]   [여행 일수]   [대륙]   ...          │  (탭/필터)
│                                              │
│ ─── 등급 ───                                 │
│  🥇 노마드 (보유)                             │
│  🛡️ 글로브트로터 (잠금 — 28/36)              │
│  ...                                         │
│                                              │
│ ─── 여행 일수 ───                            │
│  📆 한 달의 방랑 (보유)                       │
│  ...                                         │
│                                              │
│ ─── 🔒 Premium · 나이 도전 ───              │
│  🔒 ?????                                    │
│  🔒 ?????                                    │
│  🔒 ?????                                    │
│  …                                           │
│                                              │
│ ─── 🔒 Premium · 시간 컬렉션 ───            │
│  🔒 ?????                                    │
│  ...                                         │
│                                              │
│ (premium_culture / premium_share /           │
│  premium_special 동일)                        │
│                                              │
│        [Premium 가입하면 모두 잠금 해제 →]   │
└──────────────────────────────────────────────┘
```

**보이는 것 (무료):**
- Premium 카테고리 헤더 (예: "Premium · 나이 도전") + 자물쇠 아이콘
- 해당 카테고리의 **호칭 슬롯 개수** (단계 수만큼 자물쇠 줄 표시)

**가려지는 것 (무료):**
- 호칭명 — `?????` 또는 자물쇠 아이콘으로 대체
- 호칭 설명·조건·아이콘
- 잠금 해제 진행률

**의도:** 마일스톤 탭에서는 "어떤 도전이 있는지" 알 수 있지만, 호칭 탭에서는 "어떤 보상이 기다리는지"는 결제 후에야 발견. 두 화면의 노출 강도 차이가 결제 동기를 만든다.

#### 4.2.2 유료 사용자 화면

기존 호칭 화면과 동일한 형식. Premium 카테고리는:
- 보유 호칭은 컬러풀 풀 표시
- 미보유 호칭은 일반 잠금처럼 회색 + 조건 텍스트 노출 ("만 30세 전 20개국 도달 시 잠금 해제" 등)
- 카테고리 헤더에 "Premium" 뱃지로만 식별 (자물쇠 X)

#### 4.2.3 일반 잠금 vs Premium 잠금

| 구분 | 일반 잠금 호칭 | Premium 잠금 호칭 (무료 사용자) |
|---|---|---|
| 호칭명 | 노출 (예: "노마드") | 가림 (`?????`) |
| 조건 | 노출 ("22개국 방문 시") | 가림 |
| 아이콘 | 회색 실루엣 | 자물쇠 |
| 진행률 | 노출 | 가림 |

### 4.3 잠금 해제 연출

기존 BadgeNotification 알림 그대로 활용. 단:
- A1 N Before N 단계 돌파 시 별도 컨페티 (시간 압박 호칭이라 가치 강조).
- E1/E2 점유율 50% / 75% 돌파 시 풀스크린 모달 (인스타 공유 옵션 노출).

### 4.4 결제 직후 첫 진입 연출

무료 → 유료 전환 시점에 호칭 탭이 처음 잠금 해제되는 순간이 가장 강한 보상 모먼트:

- 잠금 해제 시 한 번만, **이미 조건을 회고적으로 만족한 호칭들**(A1·A2 회고 보존이 핵심)을 한 번에 풀어주며 "Premium 컬렉션 X개 즉시 잠금 해제!" 모달 노출
- 이 회고 호칭은 무료 시절의 사진 EXIF를 다시 스캔해 평가 (§6.2 참조)
- 사용자 발견의 즐거움 극대화 → 결제 후 첫 인상이 "내가 그동안 모은 게 이렇게 많았구나"가 되도록

---

## 5. 호칭 명명 다국어 가이드라인

호칭은 i18n으로 모든 지원 언어에 번역되므로, 한국어만 멋있고 다른 언어가 어색하면 호칭의 가치가 깨진다. 명명 단계에서부터 다국어 어감을 함께 검토한다.

### 5.1 언어별 톤 / 패턴

| 언어 | 어감 원칙 |
|---|---|
| 한국어 | 한자어 + 순우리말 균형. 친근함과 멋스러움의 양립 |
| 영어 | 짧고 강한 운율(alliteration·rhyme). 숫자·N Before N 같은 mnemonic 패턴 활용 |
| 일본어 | 4~6자 한자어 시적 표현. 「半生の旅人」「四季の収集家」「人類の半分」 |
| 중국어 간체 | 4자 성어 패턴 선호. 「环球一周」「人类四分之一」 |
| 스페인어 | 라틴계 우아함, 명사구 자연어순. "Coleccionista de Estaciones" |
| 기타 | 직역체 회피. 그 언어의 자연스러운 호칭 어법을 따른다 |

### 5.2 검증 절차

호칭 후보가 정해지면 i18n 작업 이전에:

1. ko / en 합의안을 먼저 확정
2. 각 지원 언어로 번역 후 네이티브 또는 다국어 LLM 검수
3. **번역 결과가 어색하면 호칭 자체를 재작명** — 영어가 어색한 호칭은 다른 언어에서도 십중팔구 깨짐
4. 동적 호칭(예: "(국가) 사계절")은 언어별 어순 차이까지 검토. "Japan Four Seasons" / 「日本の四季」 / "Las Cuatro Estaciones de Japón" 처럼 자연스러운 형태로 i18n 키 설계

### 5.3 i18n 키 컨벤션

```
badges.premium.<id>.title        // 정적 호칭
badges.premium.<id>.description  // 잠금 해제 설명
badges.premium.dynamic.<id>      // 동적 호칭 — {{country}} 같은 보간 변수 포함
```

기존 `badgeI18n.ts`의 패턴을 따른다. 동적 호칭은 ICU MessageFormat의 `{country}` 보간으로 처리하고, 어순이 다른 언어는 키만 같고 형식이 자연스럽도록 각 로케일에서 별도 작성.

---

## 6. 평가 로직 / 마이그레이션

### 6.1 평가 트리거

기존 `evaluateBadges`가 호출되는 모든 시점에서 동일하게 호출. `premiumContext`가 null이면 (무료 사용자) 신규 호칭 emit 안 함.

### 6.2 PremiumContext 구축 비용

A1·A2 단계 평가는 사진 한 장씩의 `taken_at` × `birthYear` 비교가 필요. 사용자별 첫 활성화 시 1회 마이그레이션:

```sql
-- 의사코드 (실제는 visit/photos.ts 함수로)
SELECT country_code, taken_at FROM visit_photos WHERE deleted_at IS NULL;

// 메모리에서:
const ageAtPhoto = computeAge(takenAt, birthYear, birthMonth, birthDay);
const decade = floor(ageAtPhoto / 10) * 10;  // 10, 20, 30, 40, 50
visitedCountriesByDecade[decade].add(countryCode);

// A1 N Before N 평가:
for (const targetN of [10, 30, 50, 100]) {
  const cutoffAge = targetN === 10 ? 20 : targetN; // 10/30/50/100 → 20/30/40/50
  const countriesBeforeAge = collect photos where ageAtPhoto < cutoffAge;
  if (countriesBeforeAge.size >= targetN) unlockBadge(`pn_before_n_${cutoffAge}`);
}
```

비용: 사진 N장 × O(1) → 사진 1만 장 가정 시 100ms 안쪽. 충분히 빠름.

### 6.3 동적 호칭 갱신

C1 사계절은 사진 추가/삭제마다 해당 국가의 seasonSet 재계산. 기존 visitStore의 사진 변경 hook에 통합.

---

## 7. 결정·미해결 사항

### 결정됨
- **좌표 기반 마일스톤(반구·5선·고도) 제외** — DB 마이그레이션 부담. v2 이후로 보류.
- **성별 기반 호칭 분기 없음** — 한국어 어감 차별화의 가치가 단조롭다고 사용자 판단.
- **D1 색상 팔레트 7색** — 빨/주/노/초/파/검/흰. 메탈릭은 노랑/흰색에 통합.
- **A1 N Before N 5단계 완화** — 5/10/20/30/50개국, 만 20/25/30/40/50세 전. 결제자 대부분이 적어도 1~2단계는 받을 수 있도록.
- **사계절은 본국 제외** — 본국 거주자 자동 충족 방지.
- **회고 보존** — A1 N Before N, A2 Decade Stamps는 한 번 잠금 해제하면 영구.
- **다국어 어감 가이드라인 (§5)** — 호칭 명명 시 ko/en 합의 후 다국어 검수, 어색하면 재작명.
- **가시성 정책 비대칭** — 마일스톤 탭은 이름·아이콘·한 줄 설명까지 무료 사용자에게 노출(결제 동기), 호칭 탭은 자물쇠로 호칭명·조건 모두 가림(결제 후 발견의 즐거움). §4 참조.
- **결제 직후 회고 호칭 일괄 잠금 해제** — 무료 시절의 사진·여행 데이터를 그대로 평가해 이미 만족된 모든 Premium 호칭을 한 번에 부여. A1·A2처럼 시간 압박이 있는 회고 보존 호칭은 특히 의미 큼. 결제 직후 첫 보상 모먼트 극대화.

### 미해결 (Open Questions)
1. **결제 시스템(IAP) 자체는 별도 워크.** v1에서 `isPremium`을 어디에 저장할지 — supabase 컬럼(서버 검증 가능, 권장) vs AsyncStorage(임시).
2. **남반구 사계절 매핑** — v1은 단순 북반구 기준 월 매핑. 호주·뉴질랜드·아르헨티나·칠레 등은 자국에서 4계절을 채워도 "12월 사진"이 "겨울"로 잘못 분류됨. v2에서 위도 기반 보정 필요(=좌표 데이터 도입과 묶임).
3. **E1/E2 인구·면적 데이터 출처** — UN 2023년 통계? World Bank? 기준 시점 명시 필요. 시간 흐름에 따라 인구 변동 → 데이터 갱신 정책.
4. **A2 Decade 컷오프 차별화** — 50대 이후를 "신규 15국"으로만 두면 60·70대 사용자는 동일 카드만 받음. 미세 단계(50s/60s+) 분리는 v2.

### 의도적 제외 (사용자 결정)
- 좌표/고도 마일스톤 (B1·B2·B4)
- AtoZ·섬·내륙·희귀국·계절 외 시간 (안 3에 있던 후보들)
- 세대 백분위 호칭 (안 2의 차별점)
- 24시간 사진사 (C 그룹의 약한 후보)

---

## 8. 구현 로드맵 (v1 워크 단위)

| 단계 | 범위 | 의존 |
|---|---|---|
| 1 | 정적 데이터 5종 작성·검증 | — |
| 2 | `PremiumMilestoneId` 타입 + `PREMIUM_MILESTONE_KINDS` 추가 | — |
| 3 | `evaluateMilestone` 확장 — A1, A2, A3 | birthYear 조회 |
| 4 | `evaluateMilestone` 확장 — C1, C2 | photo taken_at 집계 |
| 5 | `evaluateMilestone` 확장 — D1, D2, E1, E2, B3 | 정적 데이터 |
| 6 | `evaluateBadges` 확장 — 신규 호칭 emit | 위 모두 |
| 7 | `entitlement` 임시 토글 (dev only) | — |
| 8 | MilestonesScreen UI — Locked Silhouette 섹션 | 6, 7 |
| 9 | TitlesScreen UI — 신규 5개 카테고리 | 6 |
| 10 | i18n (ko/en 호칭 라벨) | 6 |
| 11 | 단위 테스트 — 평가 함수 정확성 | 3~6 |
| 12 | 결제 게이팅 통합 (IAP 도입 후 별도 워크) | 7 외 의존 |
