# 국가 상세 페이지 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `CountryDetailScreen`의 hero 카드와 통계 카드를 하나의 컬러 카드로 통합하고, 빈 상태에 일러스트를 추가한다.

**Architecture:**
- 기존 hero(도트맵)와 statsCard(통계)를 신규 `HeroCard` 컴포넌트로 통합. 배경은 국가별 동적 색(`colorForCountry`) 유지. 빈 상태는 신규 `EmptyTrips` 컴포넌트로 분리, PNG 일러스트 자산 사용.
- 컴포넌트는 책임 단위로 파일 분리 (CLAUDE.md 5조). i18n은 10개 locale 동시 반영 (CLAUDE.md 8조).

**Tech Stack:** React Native, Expo, lucide-react-native (Briefcase/Calendar/Image 아이콘), 기존 `@shopify/react-native-skia` 기반 `CountryDotMap`, `useTheme` 훅.

**참고 문서:** [docs/superpowers/specs/2026-05-15-country-detail-redesign-design.md](../specs/2026-05-15-country-detail-redesign-design.md)

---

## Task 1: 빈 상태 일러스트 자산 추가

**Files:**
- Create: `assets/empty-trips.png` (사용자가 첨부한 PNG 파일)

- [ ] **Step 1: 사용자에게 첨부 PNG 파일 경로 묻기**

사용자가 두 번째 메시지에 첨부한 이미지(카메라 + 폴라로이드 + 비행기 점선)를 `assets/empty-trips.png`로 저장해야 한다. Claude Code 세션에서는 첨부 파일이 임시 디렉터리에 저장되므로, 사용자에게 파일 경로를 직접 묻거나, 사용자가 직접 `cp <path> assets/empty-trips.png` 하도록 안내한다.

질문 예시: "첨부하신 빈 상태 일러스트 PNG를 `assets/empty-trips.png`로 저장해야 합니다. (1) 파일 경로를 알려주시면 제가 복사하거나, (2) 직접 `cp <원본경로> assets/empty-trips.png` 실행해 주세요. 어느 쪽이 편하신가요?"

- [ ] **Step 2: 파일 존재 확인**

Run: `ls -la assets/empty-trips.png`
Expected: 파일이 존재하고 크기가 0이 아님 (사용자 첨부 이미지 크기)

만약 파일이 없으면 Step 1로 돌아간다. 이 자산 없이는 Task 3(EmptyTrips 컴포넌트)이 동작하지 않는다.

- [ ] **Step 3: Commit**

```bash
git add assets/empty-trips.png
git commit -m "chore(assets): add empty-trips illustration for country detail empty state"
```

---

## Task 2: i18n 키 교체 — 10개 locale 동시 반영

**Files:**
- Modify: `src/i18n/locales/ko.json`, `en.json`, `ja.json`, `zh-CN.json`, `zh-TW.json`, `es.json`, `fr.json`, `de.json`, `it.json`, `ru.json`

각 파일에서 `countryDetail.empty` 키를 제거하고 `emptyLine1`, `emptyLine2`로 교체한다.

- [ ] **Step 1: ko.json 수정**

`src/i18n/locales/ko.json` 의 `countryDetail` 블록에서:

```diff
   "countryDetail": {
     "statVisits": "회 방문",
     "statDays": "일 누적",
     "statPhotos": "장의 사진",
     "sectionTrips": "여행 기록",
     "swipeToDelete": "← 옆으로 밀어 삭제",
     "sortLatest": "최신순",
-    "empty": "아직 이 나라의 여행 기록이 없어요.",
+    "emptyLine1": "아직 이 나라의",
+    "emptyLine2": "여행 기록이 없어요.",
     "tripPhotos": "{{count}}장",
     ...
```

- [ ] **Step 2: 나머지 9개 locale 수정**

같은 패턴으로 각 locale의 `countryDetail.empty`를 두 줄로 분리한다.

| 파일 | emptyLine1 | emptyLine2 |
|---|---|---|
| `en.json` | `"No trips to"` | `"this country yet."` |
| `ja.json` | `"まだこの国の"` | `"旅行記録がありません。"` |
| `zh-CN.json` | `"还没有"` | `"这个国家的旅行记录。"` |
| `zh-TW.json` | `"還沒有"` | `"這個國家的旅行記錄。"` |
| `es.json` | `"Aún no hay viajes"` | `"a este país."` |
| `fr.json` | `"Aucun voyage"` | `"dans ce pays."` |
| `de.json` | `"Noch keine Reisen"` | `"in dieses Land."` |
| `it.json` | `"Nessun viaggio"` | `"in questo paese."` |
| `ru.json` | `"Поездок в эту"` | `"страну пока нет."` |

각 파일에서 기존 `"empty": "..."` 라인을 제거하고 두 키를 추가한다. JSON 콤마 위치 주의.

- [ ] **Step 3: 모든 locale JSON parse 검증**

Run:
```bash
for f in src/i18n/locales/*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8')); console.log('OK: $f')" || { echo "FAIL: $f"; exit 1; }
done
```

Expected: 10개 파일 모두 `OK: ...` 출력.

- [ ] **Step 4: 새 키 존재 확인**

Run:
```bash
for f in src/i18n/locales/*.json; do
  node -e "const d=JSON.parse(require('fs').readFileSync('$f','utf8')); const k=d.countryDetail; if(!k.emptyLine1||!k.emptyLine2||k.empty){throw new Error('$f: emptyLine1/emptyLine2 누락 또는 empty 잔존');} console.log('OK: $f')"
done
```

Expected: 10개 모두 `OK: ...` 출력.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/locales/*.json
git commit -m "i18n(countryDetail): empty 키를 emptyLine1/emptyLine2 2줄 텍스트로 교체"
```

---

## Task 3: EmptyTrips 컴포넌트 신규 작성

**Files:**
- Create: `src/screens/CountryDetailScreen/EmptyTrips.tsx`
- Create: `src/screens/CountryDetailScreen/EmptyTrips.styles.ts`

여행 기록이 0건일 때 표시되는 일러스트 + 2줄 텍스트 컴포넌트.

- [ ] **Step 1: 스타일 파일 작성 — `EmptyTrips.styles.ts`**

```typescript
import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export function makeEmptyTripsStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      paddingTop: 40,
      paddingBottom: 24,
    },
    illustration: {
      width: 200,
      height: 160,
      marginBottom: 16,
    },
    line: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "500",
      textAlign: "center",
      lineHeight: 22,
    },
  });
}
```

- [ ] **Step 2: 컴포넌트 파일 작성 — `EmptyTrips.tsx`**

```typescript
import React, { useMemo } from "react";
import { Image, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";

import { makeEmptyTripsStyles } from "./EmptyTrips.styles";

export default function EmptyTrips() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeEmptyTripsStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../assets/empty-trips.png")}
        style={styles.illustration}
        resizeMode="contain"
      />
      <Text style={styles.line}>{t("countryDetail.emptyLine1")}</Text>
      <Text style={styles.line}>{t("countryDetail.emptyLine2")}</Text>
    </View>
  );
}
```

> `require("../../../assets/empty-trips.png")` 경로는 `src/screens/CountryDetailScreen/` 기준 3단계 위(`assets/`)로 올라간다.

- [ ] **Step 3: TypeScript 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (단, 다른 파일에 기존 에러가 있을 수 있으므로 EmptyTrips 관련 에러만 없으면 OK).

- [ ] **Step 4: Commit**

```bash
git add src/screens/CountryDetailScreen/EmptyTrips.tsx src/screens/CountryDetailScreen/EmptyTrips.styles.ts
git commit -m "feat(country-detail): EmptyTrips 컴포넌트 추가 — 일러스트 + 2줄 텍스트"
```

---

## Task 4: HeroCard 컴포넌트 신규 작성

**Files:**
- Create: `src/screens/CountryDetailScreen/HeroCard.tsx`
- Create: `src/screens/CountryDetailScreen/HeroCard.styles.ts`

좌상단 국가명/코드 + 우측 도트맵 + 하단 통계 3컬럼을 모두 포함하는 통합 컬러 카드.

- [ ] **Step 1: 스타일 파일 작성 — `HeroCard.styles.ts`**

```typescript
import { StyleSheet } from "react-native";

const WHITE_PRIMARY = "#FFFFFF";
const WHITE_SECONDARY = "rgba(255,255,255,0.7)";
const WHITE_LABEL = "rgba(255,255,255,0.75)";
const DIVIDER = "rgba(255,255,255,0.25)";

export const heroStyles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    marginBottom: 28,
    minHeight: 320,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    minHeight: 180,
  },
  textArea: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    color: WHITE_PRIMARY,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
  },
  code: {
    color: WHITE_SECONDARY,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 1,
  },
  dotArea: {
    width: "55%",
    aspectRatio: 1,
    alignSelf: "flex-start",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  statIconWrap: {
    marginBottom: 6,
  },
  statNum: {
    color: WHITE_PRIMARY,
    fontSize: 26,
    fontWeight: "800",
  },
  statLabel: {
    color: WHITE_LABEL,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: DIVIDER,
  },
});

export const HERO_DOT_COLOR = "rgba(255,255,255,0.95)";
```

- [ ] **Step 2: 컴포넌트 파일 작성 — `HeroCard.tsx`**

```typescript
import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Briefcase, Calendar, Image as ImageIcon } from "lucide-react-native";

import CountryDotMap from "../../components/CountryDotMap";
import { colorForCountry } from "../../utils/countryColors";

import { heroStyles, HERO_DOT_COLOR } from "./HeroCard.styles";

type Props = {
  code: string;
  name: string;
  visits: number;
  days: number;
  photos: number;
};

export default function HeroCard({ code, name, visits, days, photos }: Props) {
  const { t } = useTranslation();
  const bg = colorForCountry(code).bg;

  return (
    <View style={[heroStyles.card, { backgroundColor: bg }]}>
      <View style={heroStyles.topRow}>
        <View style={heroStyles.textArea}>
          <Text style={heroStyles.name} numberOfLines={2}>
            {name}
          </Text>
          <Text style={heroStyles.code}>{code}</Text>
        </View>
        <View style={heroStyles.dotArea}>
          <CountryDotMap countryCode={code} color={HERO_DOT_COLOR} />
        </View>
      </View>

      <View style={heroStyles.statsRow}>
        <StatCol
          icon={<Briefcase size={22} color="#FFFFFF" strokeWidth={2} />}
          value={visits}
          label={t("countryDetail.statVisits")}
        />
        <View style={heroStyles.statDivider} />
        <StatCol
          icon={<Calendar size={22} color="#FFFFFF" strokeWidth={2} />}
          value={days}
          label={t("countryDetail.statDays")}
        />
        <View style={heroStyles.statDivider} />
        <StatCol
          icon={<ImageIcon size={22} color="#FFFFFF" strokeWidth={2} />}
          value={photos}
          label={t("countryDetail.statPhotos")}
        />
      </View>
    </View>
  );
}

function StatCol({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <View style={heroStyles.statCol}>
      <View style={heroStyles.statIconWrap}>{icon}</View>
      <Text style={heroStyles.statNum}>{value}</Text>
      <Text style={heroStyles.statLabel}>{label}</Text>
    </View>
  );
}
```

- [ ] **Step 3: TypeScript 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (또는 HeroCard 관련 에러 없음).

- [ ] **Step 4: Commit**

```bash
git add src/screens/CountryDetailScreen/HeroCard.tsx src/screens/CountryDetailScreen/HeroCard.styles.ts
git commit -m "feat(country-detail): HeroCard 컴포넌트 추가 — 국가명/도트맵/통계 3개 통합"
```

---

## Task 5: CountryDetailScreen 본체에 HeroCard / EmptyTrips 연결

**Files:**
- Modify: `src/screens/CountryDetailScreen.tsx`
- Modify: `src/screens/CountryDetailScreen/styles.ts`

기존 hero 카드 + statsCard 영역을 `<HeroCard />` 한 줄로 교체. 기존 empty 텍스트를 `<EmptyTrips />`로 교체. 더이상 안 쓰는 스타일 제거.

- [ ] **Step 1: `CountryDetailScreen.tsx` — import 정리**

기존 import 블록(라인 1~24)에서:

```diff
 import React, { useEffect, useMemo, useState } from "react";
 import { Alert, Pressable, ScrollView, Text, View } from "react-native";
 import { useTranslation } from "react-i18next";

-import CountryDotMap from "../components/CountryDotMap";
 import {
   countPhotosForCountry,
   countPhotosForTrip,
   deleteTrip,
   loadTripsForCountry,
   RecentTrip,
   TripWithPhotos,
 } from "../features/travel/visitRepository";
 import { useVisitStore } from "../features/travel/visitStore";
 import { useScreenBottomInset } from "../hooks/useScreenInsets";
 import { getCurrentLocale } from "../i18n";
 import { getCountryName } from "../lib/countryName";
 import { useTheme } from "../theme/themeStore";
-import { colorForCountry } from "../utils/countryColors";
 import { flagEmoji } from "../utils/flag";

+import EmptyTrips from "./CountryDetailScreen/EmptyTrips";
+import HeroCard from "./CountryDetailScreen/HeroCard";
 import { makeStyles } from "./CountryDetailScreen/styles";
 import TripRow from "./CountryDetailScreen/TripRow";
 import { formatMD, groupByYear } from "./CountryDetailScreen/utils";
```

(`CountryDotMap`, `colorForCountry`는 HeroCard 안에서 사용하므로 이 파일에선 제거.)

- [ ] **Step 2: `CountryDetailScreen.tsx` — hero/stats 영역 교체**

기존 라인 115~187에서:

```diff
   const flag = flagEmoji(selectedCountry.code);
   const hasTrips = (trips?.length ?? 0) > 0;
-  const countryColor = colorForCountry(selectedCountry.code);
+  const countryName = getCountryName(
+    selectedCountry.code,
+    getCurrentLocale()
+  );

   return (
     <View style={[styles.root, { paddingBottom: bottomInset }]}>
       <View style={styles.header}>
         ...
         <View style={styles.headerCenter}>
           <Text style={styles.headerFlag}>{flag}</Text>
           <Text style={styles.headerTitle} numberOfLines={1}>
-            {getCountryName(selectedCountry.code, getCurrentLocale())}
+            {countryName}
           </Text>
           <Text style={styles.headerCode}>{selectedCountry.code}</Text>
         </View>
         ...
       </View>

       <ScrollView
         contentContainerStyle={styles.scrollContent}
         showsVerticalScrollIndicator={false}
       >
-        <View style={[styles.heroCard, { backgroundColor: countryColor.bg }]}>
-          <View style={styles.heroDots}>
-            <CountryDotMap
-              countryCode={selectedCountry.code}
-              color={countryColor.dot}
-            />
-          </View>
-        </View>
-
-        <View style={styles.statsCard}>
-          <StatCol
-            value={trips?.length ?? 0}
-            unit={t("countryDetail.statVisits")}
-          />
-          <View style={styles.statDivider} />
-          <StatCol value={totalDays} unit={t("countryDetail.statDays")} />
-          <View style={styles.statDivider} />
-          <StatCol
-            value={photoTotal ?? 0}
-            unit={t("countryDetail.statPhotos")}
-          />
-        </View>
+        <HeroCard
+          code={selectedCountry.code}
+          name={countryName}
+          visits={trips?.length ?? 0}
+          days={totalDays}
+          photos={photoTotal ?? 0}
+        />
```

또한 같은 파일 하단의 `StatCol` 헬퍼 함수(라인 276~285)와 `addTrip`에서 다시 `getCountryName(...)`을 호출하던 부분도 정리:

```diff
             {!editMode && onAddTrip && (
               <Pressable
                 onPress={() =>
                   onAddTrip({
                     code: selectedCountry.code,
-                    name: getCountryName(
-                      selectedCountry.code,
-                      getCurrentLocale()
-                    ),
+                    name: countryName,
                   })
                 }
                 ...
```

```diff
   ...
 }
-
-function StatCol({ value, unit }: { value: number; unit: string }) {
-  const theme = useTheme();
-  const styles = useMemo(() => makeStyles(theme), [theme]);
-  return (
-    <View style={styles.statCol}>
-      <Text style={styles.statNum}>{value}</Text>
-      <Text style={styles.statUnit}>{unit}</Text>
-    </View>
-  );
-}
```

- [ ] **Step 3: `CountryDetailScreen.tsx` — empty 텍스트 → `<EmptyTrips />`**

기존 라인 239~246에서:

```diff
         {trips == null ? (
           <View style={styles.emptyWrap}>
             <Text style={styles.emptyText}>{t("common.loading")}</Text>
           </View>
         ) : trips.length === 0 ? (
-          <View style={styles.emptyWrap}>
-            <Text style={styles.emptyText}>{t("countryDetail.empty")}</Text>
-          </View>
+          <EmptyTrips />
         ) : (
```

> 로딩 중(`trips == null`) 케이스의 `styles.emptyWrap` + `styles.emptyText`는 그대로 유지한다.

- [ ] **Step 4: `styles.ts` — 더이상 안 쓰는 스타일 제거**

`src/screens/CountryDetailScreen/styles.ts`에서 아래 키들을 제거한다:

- `heroCard` (라인 73~79)
- `heroDots` (라인 80~82)
- `statsCard` (라인 83~92)
- `statCol` (라인 93~97)
- `statNum` (라인 98~102)
- `statUnit` (라인 103~107)
- `statDivider` (라인 108~112)

(그 외 `emptyWrap`, `emptyText`는 로딩 메시지에서 계속 사용되므로 **유지**한다.)

- [ ] **Step 5: TypeScript 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: `CountryDetailScreen` 관련 에러 없음.

만약 다른 파일에서 `styles.ts`에 제거된 키(`heroCard`, `statsCard` 등)를 import하는 경우가 있다면 에러가 난다. Run: `grep -rn "heroCard\|statsCard\|statCol\|statNum\|statUnit\|statDivider\|heroDots" src/ --include="*.ts" --include="*.tsx"` 로 추가 사용처가 있는지 확인.
Expected: `src/screens/CountryDetailScreen.tsx` (이미 수정됨)와 `src/screens/CountryDetailScreen/styles.ts` 외에는 hit 없음. (있다면 해당 파일도 정리 필요.)

- [ ] **Step 6: Commit**

```bash
git add src/screens/CountryDetailScreen.tsx src/screens/CountryDetailScreen/styles.ts
git commit -m "refactor(country-detail): HeroCard/EmptyTrips로 본문 분리, 미사용 스타일 정리"
```

---

## Task 6: 시뮬레이터 시각 검증

**Files:** (변경 없음 — 시뮬레이터 동작 확인만)

- [ ] **Step 1: Metro 번들러 실행 안내**

이 프로젝트는 Expo + React Native이므로 실제 빌드/실행은 사용자가 디바이스에서 수행한다. `flutter-run` 스킬이 아니라 `howtorun` 스킬을 사용하여 사용자에게 명령을 안내한다.

사용자에게 안내할 명령 (한 가지만 선택):
- iOS 시뮬레이터: `npx expo run:ios`
- Android: `npx expo run:android`
- 또는 이미 빌드된 앱에 dev 서버만 붙이려면: `npx expo start`

- [ ] **Step 2: 사용자 수동 시각 확인 체크리스트**

사용자에게 다음을 확인하도록 요청한다:

1. **여행 기록이 있는 국가** (예: 사용자가 방문한 국가 진입)
   - Hero 카드 좌상단에 국가명 큰 텍스트로 노출
   - 그 아래 작은 KR (또는 ISO 코드) 노출
   - 우측에 도트맵 노출 (흰색 톤)
   - 하단에 가방/캘린더/액자 아이콘 + 숫자(방문수/일수/사진수) + 라벨 노출
   - 컬럼 사이 세로 구분선 보임
   - 카드 배경은 국가별 다른 색 (한국=파랑, 일본=빨강 등)

2. **여행 기록이 0인 국가** (예: 아직 안 가본 국가 진입)
   - Hero 카드는 정상 노출 (숫자만 0)
   - "여행 기록" 섹션 헤더 아래 일러스트(카메라/폴라로이드/비행기) + 2줄 텍스트 노출

3. **다크모드 토글**
   - Hero 카드는 그대로 (배경 컬러 + 흰색 텍스트)
   - 빈 상태 일러스트가 다크 배경에서 너무 떠보이지 않는지 확인 (필요 시 후속 PR에서 opacity 조정)

4. **긴 국가명** (예: 미국=United States, 보스니아 헤르체고비나 등)
   - 국가명이 2줄까지 wrap, 도트맵 영역을 침범하지 않음

5. **편집 모드** 토글 → 여행 카드 swipe 삭제 정상 동작
6. **언어 전환** (설정 → 언어) → 새 emptyLine1/emptyLine2 텍스트가 각 언어로 노출

- [ ] **Step 3: 검증 결과 보고**

사용자가 위 1~6 모두 OK라고 확인하면 Task 완료. 문제가 있으면 해당 항목에 맞춰 Task 4 또는 Task 5의 스타일을 미세 조정한다 (예: 도트맵 폭 조정, 텍스트 사이즈 조정).

---

## Task 7: 최종 정리 — main 스쿼시 머지 제안

**Files:** (변경 없음 — git 작업만)

CLAUDE.md 6조에 따라 워크트리 작업이 완전히 끝났다고 판단되면 main에 스쿼시 머지를 명시적으로 제안한다.

- [ ] **Step 1: 모든 task 완료 확인**

- [ ] Task 1: 자산 추가 commit 됨
- [ ] Task 2: i18n commit 됨
- [ ] Task 3: EmptyTrips commit 됨
- [ ] Task 4: HeroCard commit 됨
- [ ] Task 5: CountryDetailScreen 리팩토링 commit 됨
- [ ] Task 6: 사용자 시각 검증 OK

- [ ] **Step 2: 사용자에게 main 스쿼시 머지 제안**

사용자에게 다음과 같이 묻는다:

"국가 상세 페이지 리디자인 작업이 끝났습니다. CLAUDE.md 6조에 따라 main에 스쿼시 머지를 진행할까요? (워크트리 브랜치 `claude/amazing-babbage-3d8f07` → main, 단일 커밋)"

승인 시 다음 명령 실행 (CLAUDE.md 7조에 따라 push는 하지 않음):

```bash
git checkout main
git merge --squash claude/amazing-babbage-3d8f07
git commit -m "feat(country-detail): 페이지 리디자인 — Hero 카드 통합 + 빈 상태 일러스트"
```

- [ ] **Step 3: 워크트리 정리 여부 확인**

사용자에게 워크트리/피처 브랜치 정리 여부를 묻고, OK 받으면:

```bash
git worktree remove .claude/worktrees/amazing-babbage-3d8f07
git branch -D claude/amazing-babbage-3d8f07
```

---

## Self-Review 결과

**Spec coverage:**
- ✅ Hero 카드 통합 → Task 4
- ✅ 별도 통계 카드 삭제 → Task 5 Step 4
- ✅ 빈 상태 일러스트 → Task 1 (자산) + Task 3 (컴포넌트) + Task 5 Step 3 (연결)
- ✅ i18n 10개 locale → Task 2
- ✅ 파일 분리 (HeroCard, EmptyTrips) → Task 3, 4
- ✅ 도트맵 흰색 톤 전달 → Task 4 Step 2 (`HERO_DOT_COLOR`)
- ✅ 통계 아이콘 (lucide Briefcase/Calendar/Image) → Task 4 Step 2
- ✅ 검증 계획 → Task 6

**Placeholder scan:** 없음. 각 step에 실제 code/명령/체크리스트 포함.

**Type consistency:**
- `HeroCard` props: `code, name, visits, days, photos` (Task 4 Step 2) ↔ `CountryDetailScreen.tsx` 호출부 (Task 5 Step 2) 일치.
- `EmptyTrips` props 없음 ↔ 호출부도 props 없음 일치.
- `makeEmptyTripsStyles(theme)` (Task 3 Step 1) ↔ `EmptyTrips.tsx` 호출 (Task 3 Step 2) 일치.
- `heroStyles` (named export, theme 의존성 없음) ↔ `HeroCard.tsx`의 `import { heroStyles, HERO_DOT_COLOR }` 일치.

---

## Plan complete

Plan saved to [docs/superpowers/plans/2026-05-15-country-detail-redesign.md](2026-05-15-country-detail-redesign.md).
