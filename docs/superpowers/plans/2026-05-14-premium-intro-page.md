# 프리미엄 기능 안내 페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱 설치 후 채팅(AI) 탭을 처음 누른 무료 사용자에게, 채팅 진입 전 유료 기능을 실제 UI와 함께 소개하는 페이지를 딱 한 번 띄운다.

**Architecture:** `PremiumIntro`를 RootStack 화면으로 추가하고, `MainTabs`의 AI 탭 `tabPress`를 가로채 `tier==='free' && !seen`일 때 이 화면으로 보낸다. "본 적 있음" 상태는 zustand + AsyncStorage 스토어(`premiumIntroStore`)에 영속화하며 `onboardingStore` 패턴을 그대로 따른다. 화면은 좌우 스와이프 캐러셀(슬라이드 4개) + 하단 고정 CTA로 구성하고, 각 슬라이드는 실제 컴포넌트(`AiChatBubble`·`BadgeMedal`·`PalettePicker`·`MapThemeLockRow`)를 재사용하거나 양식화된 목업으로 데모를 보여준다.

**Tech Stack:** React Native (Expo), TypeScript (strict), zustand, AsyncStorage, React Navigation (native-stack + bottom-tabs), i18next, Jest (node env, babel-jest).

**설계 문서:** [docs/superpowers/specs/2026-05-14-premium-intro-page-design.md](../specs/2026-05-14-premium-intro-page-design.md)

---

## 파일 구조

**신규**
- `src/features/premiumIntro/premiumIntroStore.ts` — zustand + AsyncStorage, `seen` 플래그
- `src/features/premiumIntro/premiumIntroStore.test.ts` — 스토어 단위 테스트
- `src/screens/PremiumIntroScreen/index.tsx` — 캐러셀 컨테이너, 마운트 시 `markSeen`
- `src/screens/PremiumIntroScreen/styles.ts` — 화면 공통 스타일
- `src/screens/PremiumIntroScreen/PagingDots.tsx` — 하단 4점 인디케이터
- `src/screens/PremiumIntroScreen/PremiumIntroFooter.tsx` — CTA 버튼 + 보조 링크
- `src/screens/PremiumIntroScreen/slides/SlideFrame.tsx` — 슬라이드 공통 틀(아이콘+제목 / 설명 / 데모 영역)
- `src/screens/PremiumIntroScreen/slides/AiChatSlide.tsx`
- `src/screens/PremiumIntroScreen/slides/DeviceSyncSlide.tsx`
- `src/screens/PremiumIntroScreen/slides/TitlesSlide.tsx`
- `src/screens/PremiumIntroScreen/slides/MapStyleSlide.tsx`
- `src/navigation/screens/PremiumIntroScreenNav.tsx`

**수정**
- `src/navigation/types.ts` — `RootStackParamList`에 `PremiumIntro` 추가, `Main`을 `NavigatorScreenParams` 허용으로
- `src/navigation/RootNavigator.tsx` — `PremiumIntro` 스크린 등록
- `src/navigation/MainTabs.tsx` — AI 탭 `tabPress` 가로채기 리스너
- `App.tsx` — `premiumIntroStore` hydrate 게이트 연결
- `src/i18n/locales/ko.json`, `src/i18n/locales/en.json` — `premiumIntro` 네임스페이스

---

## Task 1: premiumIntroStore (zustand + AsyncStorage)

**Files:**
- Create: `src/features/premiumIntro/premiumIntroStore.ts`
- Test: `src/features/premiumIntro/premiumIntroStore.test.ts`

- [ ] **Step 1: Write the failing test**

`src/features/premiumIntro/premiumIntroStore.test.ts`:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

import { usePremiumIntroStore } from "./premiumIntroStore";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

describe("premiumIntroStore", () => {
  beforeEach(() => {
    usePremiumIntroStore.setState({ hydrated: false, seen: false });
    (AsyncStorage.getItem as jest.Mock).mockReset().mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockReset().mockResolvedValue(undefined);
  });

  it("defaults to not hydrated and not seen", () => {
    expect(usePremiumIntroStore.getState().hydrated).toBe(false);
    expect(usePremiumIntroStore.getState().seen).toBe(false);
  });

  it("hydrate reads seen=true when storage holds '1'", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("1");
    await usePremiumIntroStore.getState().hydrate();
    expect(usePremiumIntroStore.getState().seen).toBe(true);
    expect(usePremiumIntroStore.getState().hydrated).toBe(true);
  });

  it("hydrate keeps seen=false when storage is empty", async () => {
    await usePremiumIntroStore.getState().hydrate();
    expect(usePremiumIntroStore.getState().seen).toBe(false);
    expect(usePremiumIntroStore.getState().hydrated).toBe(true);
  });

  it("markSeen sets the flag and persists '1'", async () => {
    await usePremiumIntroStore.getState().markSeen();
    expect(usePremiumIntroStore.getState().seen).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "visitgrid:premiumIntro:seen_v1",
      "1"
    );
  });

  it("markSeen is a no-op when already seen", async () => {
    usePremiumIntroStore.setState({ hydrated: true, seen: true });
    await usePremiumIntroStore.getState().markSeen();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/premiumIntro/premiumIntroStore.test.ts`
Expected: FAIL — `Cannot find module './premiumIntroStore'`.

- [ ] **Step 3: Write the store implementation**

`src/features/premiumIntro/premiumIntroStore.ts`:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "visitgrid:premiumIntro:seen_v1";

type State = {
  hydrated: boolean;
  /** 프리미엄 기능 안내 페이지를 이미 봤는지 여부. 설치 1회만 노출하기 위한 플래그. */
  seen: boolean;
  hydrate: () => Promise<void>;
  markSeen: () => Promise<void>;
};

export const usePremiumIntroStore = create<State>((set, get) => ({
  hydrated: false,
  seen: false,
  hydrate: async () => {
    let seen = false;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      seen = raw === "1";
    } catch {}
    set({ hydrated: true, seen });
  },
  markSeen: async () => {
    if (get().seen) return;
    set({ seen: true });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  },
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/premiumIntro/premiumIntroStore.test.ts`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/premiumIntro/premiumIntroStore.ts src/features/premiumIntro/premiumIntroStore.test.ts
git commit -m "feat(premium-intro): seen 플래그 영속화 스토어 추가"
```

---

## Task 2: App.tsx hydrate 게이트 연결

`premiumIntroStore`를 앱 시작 시 hydrate하고, hydrate가 끝나기 전엔 스플래시를 유지하도록 `appReady` 조건에 포함시킨다. 다른 store들과 동일한 패턴.

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Import the store**

`App.tsx` 상단의 feature store import 묶음(예: `useOnboardingStore` import 줄 근처)에 추가:

```typescript
import { usePremiumIntroStore } from "./src/features/premiumIntro/premiumIntroStore";
```

- [ ] **Step 2: Add hydrate selectors**

`App()` 컴포넌트 본문에서 다른 `*Hydrate` / `*Hydrated` 셀렉터들이 모인 곳(예: `onboardingHydrate` 근처)에 추가:

```typescript
  const premiumIntroHydrate = usePremiumIntroStore((s) => s.hydrate);
  const premiumIntroHydrated = usePremiumIntroStore((s) => s.hydrated);
```

- [ ] **Step 3: Call hydrate in the startup effect**

hydrate들을 호출하는 `useEffect` 안에 `void premiumIntroHydrate();`를 추가하고, 같은 `useEffect`의 의존성 배열에도 `premiumIntroHydrate`를 추가한다. (배열 안 다른 `*Hydrate` 항목들과 같은 위치 규칙으로.)

```typescript
    void onboardingHydrate();
    void premiumIntroHydrate();
```

의존성 배열:

```typescript
  ], [
    hydrate,
    themeHydrate,
    authHydrate,
    onboardingHydrate,
    premiumIntroHydrate,
    milestoneHydrate,
    syncHydrate,
    entitlementHydrate,
    flightHydrate,
  ]);
```

- [ ] **Step 4: Add to appReady gate**

`appReady` 계산식에 `premiumIntroHydrated`를 추가:

```typescript
  const appReady =
    ready &&
    themeHydrated &&
    authHydrated &&
    onboardingHydrated &&
    premiumIntroHydrated &&
    milestoneHydrated &&
    entitlementHydrated &&
    i18nReady;
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: 통과 (에러 없음).

- [ ] **Step 6: Commit**

```bash
git add App.tsx
git commit -m "feat(premium-intro): App 시작 시 premiumIntro 스토어 hydrate"
```

---

## Task 3: i18n 키 추가 (ko + en)

`premiumIntro` 네임스페이스를 ko/en에 추가한다. 나머지 8개 로케일은 `fallbackLng: "en"`로 자동 폴백되므로 건드리지 않는다.

**Files:**
- Modify: `src/i18n/locales/ko.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: ko.json에 premiumIntro 블록 추가**

`src/i18n/locales/ko.json`의 최상위 객체에서 `"subscription"` 블록 바로 뒤(같은 들여쓰기 레벨)에 추가. 끝에 콤마 처리에 주의:

```json
  "premiumIntro": {
    "footer": {
      "cta": "구독 안내 보기",
      "later": "나중에 할게요"
    },
    "slides": {
      "aiChat": {
        "title": "AI 여행 채팅",
        "desc": "내 여행 기록을 아는 AI에게 물어보세요. 통계·추천을 대화로 끝냅니다.",
        "q1": "올해 몇 개국 다녀왔어?",
        "a1": "올해는 7개국이에요 🌍 가장 최근은 일본이었네요.",
        "q2": "다음 여행지 추천해줘",
        "a2": "기록을 보면 동남아가 비어있어요. 베트남은 어때요?"
      },
      "deviceSync": {
        "title": "기기 동기화",
        "desc": "여행 기록(dot 지도)이 모든 기기에서 똑같이. 새 폰에서도 그대로예요.",
        "devicePhone": "폰",
        "deviceTablet": "태블릿",
        "note": "클라우드 자동 백업 · 사진은 제외"
      },
      "titles": {
        "title": "호칭 · 마일스톤 해제",
        "desc": "10개가 넘는 호칭과 마일스톤 뱃지의 잠금이 풀려요.",
        "b1": "대륙 정복자",
        "b2": "100회 비행",
        "b3": "탐험가",
        "b4": "세계일주",
        "b5": "고산 여행",
        "b6": "베테랑"
      },
      "mapStyle": {
        "title": "지도 스타일",
        "desc": "dot 색 팔레트와 지도 테마를 내 취향대로 바꿔요.",
        "premiumOnly": "프리미엄 전용"
      }
    }
  }
```

- [ ] **Step 2: en.json에 premiumIntro 블록 추가**

`src/i18n/locales/en.json`의 최상위 객체에서 `"subscription"` 블록 바로 뒤에 추가:

```json
  "premiumIntro": {
    "footer": {
      "cta": "See subscription plans",
      "later": "Maybe later"
    },
    "slides": {
      "aiChat": {
        "title": "AI travel chat",
        "desc": "Ask an AI that knows your travel history. Stats and suggestions, all in chat.",
        "q1": "How many countries this year?",
        "a1": "7 countries so far 🌍 Most recently Japan.",
        "q2": "Suggest where to go next",
        "a2": "Your map is light on Southeast Asia — how about Vietnam?"
      },
      "deviceSync": {
        "title": "Device sync",
        "desc": "Your travel map stays the same across every device. Even on a new phone.",
        "devicePhone": "Phone",
        "deviceTablet": "Tablet",
        "note": "Automatic cloud backup · photos excluded"
      },
      "titles": {
        "title": "Unlock titles & milestones",
        "desc": "Over 10 titles and milestone badges get unlocked.",
        "b1": "Continent Conqueror",
        "b2": "100 Flights",
        "b3": "Explorer",
        "b4": "Around the World",
        "b5": "High Altitude",
        "b6": "Veteran"
      },
      "mapStyle": {
        "title": "Map style",
        "desc": "Change the dot color palette and map theme to your taste.",
        "premiumOnly": "Premium only"
      }
    }
  }
```

- [ ] **Step 3: JSON 유효성 + 테스트 확인**

Run: `node -e "require('./src/i18n/locales/ko.json'); require('./src/i18n/locales/en.json'); console.log('json ok')"`
Expected: `json ok` 출력 (파싱 에러 없음).

Run: `npm test -- src/__tests__/sanity.test.ts`
Expected: PASS (기존 sanity 테스트 영향 없음 확인).

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/ko.json src/i18n/locales/en.json
git commit -m "feat(premium-intro): premiumIntro i18n 키 추가 (ko/en)"
```

---

## Task 4: SlideFrame + PagingDots (공통 프레젠테이션 컴포넌트)

슬라이드 4개가 공유하는 틀(`SlideFrame`)과 하단 점 인디케이터(`PagingDots`)를 만든다. 이 단계에서는 화면에 연결하지 않고 파일만 생성한다.

**Files:**
- Create: `src/screens/PremiumIntroScreen/slides/SlideFrame.tsx`
- Create: `src/screens/PremiumIntroScreen/PagingDots.tsx`

- [ ] **Step 1: SlideFrame 작성**

`src/screens/PremiumIntroScreen/slides/SlideFrame.tsx`:

```tsx
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";

type Props = {
  /** 슬라이드 좌상단 아이콘 (이모지 1글자). */
  icon: string;
  /** 아이콘 배경 색. */
  iconBg: string;
  title: string;
  desc: string;
  /** 큰 UI 데모 영역. */
  children: React.ReactNode;
};

// 프리미엄 안내 캐러셀의 슬라이드 한 장 공통 틀.
// 상단 아이콘+제목 → 한 줄 설명 → 데모 영역(children) 순서.
export default function SlideFrame({ icon, iconBg, title, desc, children }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.desc}>{desc}</Text>
      <View style={styles.demo}>{children}</View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 12,
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: { fontSize: 22 },
    title: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: "800",
    },
    desc: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 12,
    },
    demo: {
      flex: 1,
      marginTop: 16,
      marginBottom: 8,
      backgroundColor: theme.cardBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 14,
      justifyContent: "center",
    },
  });
}
```

- [ ] **Step 2: PagingDots 작성**

`src/screens/PremiumIntroScreen/PagingDots.tsx`:

```tsx
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import type { Theme } from "../../theme/theme";
import { useTheme } from "../../theme/themeStore";

type Props = {
  count: number;
  activeIndex: number;
};

// 캐러셀 하단 점 인디케이터. 활성 점은 가로로 길어지고 accent 색.
export default function PagingDots({ count, activeIndex }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i === activeIndex ? styles.dotActive : null]}
        />
      ))}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      paddingVertical: 10,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.cardBorder,
    },
    dotActive: {
      width: 18,
      backgroundColor: theme.accent,
    },
  });
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: 통과.

- [ ] **Step 4: Commit**

```bash
git add src/screens/PremiumIntroScreen/slides/SlideFrame.tsx src/screens/PremiumIntroScreen/PagingDots.tsx
git commit -m "feat(premium-intro): 슬라이드 공통 틀·페이징 점 컴포넌트 추가"
```

---

## Task 5: AiChatSlide (실제 AiChatBubble 재사용)

샘플 Q&A 버블 4개를 실제 `AiChatBubble` 컴포넌트로 보여준다.

**Files:**
- Create: `src/screens/PremiumIntroScreen/slides/AiChatSlide.tsx`

- [ ] **Step 1: AiChatSlide 작성**

`src/screens/PremiumIntroScreen/slides/AiChatSlide.tsx`:

```tsx
import React, { useMemo } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import AiChatBubble from "../../../components/AiChat/AiChatBubble";
import type { ChatMessage } from "../../../features/aiChat/types";
import SlideFrame from "./SlideFrame";

// AI 여행 채팅 소개 슬라이드. 실제 AiChatBubble을 정적 메시지로 재사용한다.
// 데모용이라 onImagePress는 no-op.
export default function AiChatSlide() {
  const { t } = useTranslation();

  const messages: ChatMessage[] = useMemo(
    () => [
      { id: "demo-q1", role: "user", text: t("premiumIntro.slides.aiChat.q1"), createdAt: 0 },
      { id: "demo-a1", role: "assistant", text: t("premiumIntro.slides.aiChat.a1"), createdAt: 0 },
      { id: "demo-q2", role: "user", text: t("premiumIntro.slides.aiChat.q2"), createdAt: 0 },
      { id: "demo-a2", role: "assistant", text: t("premiumIntro.slides.aiChat.a2"), createdAt: 0 },
    ],
    [t]
  );

  return (
    <SlideFrame
      icon="💬"
      iconBg="#d4f4dd"
      title={t("premiumIntro.slides.aiChat.title")}
      desc={t("premiumIntro.slides.aiChat.desc")}
    >
      <View>
        {messages.map((m) => (
          <AiChatBubble key={m.id} message={m} onImagePress={() => {}} />
        ))}
      </View>
    </SlideFrame>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 통과. (`AiChatBubble`의 props는 `message: ChatMessage`, `onImagePress: (url: string) => void`, 선택적 `onCopied` — 위 호출이 일치.)

- [ ] **Step 3: Commit**

```bash
git add src/screens/PremiumIntroScreen/slides/AiChatSlide.tsx
git commit -m "feat(premium-intro): AI 채팅 소개 슬라이드 추가"
```

---

## Task 6: DeviceSyncSlide (양식화된 목업)

폰 ⇄ 태블릿 동기화 흐름을 이 화면 전용 양식화된 목업으로 그린다. "사진 제외"를 명시한다.

**Files:**
- Create: `src/screens/PremiumIntroScreen/slides/DeviceSyncSlide.tsx`

- [ ] **Step 1: DeviceSyncSlide 작성**

`src/screens/PremiumIntroScreen/slides/DeviceSyncSlide.tsx`:

```tsx
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { CloudUpload } from "lucide-react-native";

import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";
import SlideFrame from "./SlideFrame";

// 기기 동기화 소개 슬라이드. 두 기기 카드 + 동기화 화살표를 양식화된 목업으로 그린다.
function DeviceCard({
  label,
  styles,
}: {
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.device}>
      <Text style={styles.deviceLabel}>{label}</Text>
      <View style={styles.deviceScreen}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={styles.deviceDot} />
        ))}
      </View>
    </View>
  );
}

export default function DeviceSyncSlide() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <SlideFrame
      icon="☁️"
      iconBg={theme.accentSoftBg}
      title={t("premiumIntro.slides.deviceSync.title")}
      desc={t("premiumIntro.slides.deviceSync.desc")}
    >
      <View style={styles.wrap}>
        <View style={styles.devicesRow}>
          <DeviceCard label={t("premiumIntro.slides.deviceSync.devicePhone")} styles={styles} />
          <Text style={styles.arrow}>⇄</Text>
          <DeviceCard label={t("premiumIntro.slides.deviceSync.deviceTablet")} styles={styles} />
        </View>
        <View style={styles.noteRow}>
          <CloudUpload size={14} color={theme.textSecondary} strokeWidth={2.2} />
          <Text style={styles.note}>{t("premiumIntro.slides.deviceSync.note")}</Text>
        </View>
      </View>
    </SlideFrame>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    wrap: { gap: 16 },
    devicesRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    device: {
      flex: 1,
      backgroundColor: theme.homeBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 10,
      alignItems: "center",
      gap: 8,
    },
    deviceLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    deviceScreen: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      justifyContent: "center",
    },
    deviceDot: {
      width: 14,
      height: 14,
      borderRadius: 3,
      backgroundColor: theme.accent,
      opacity: 0.85,
    },
    arrow: {
      color: theme.accent,
      fontSize: 22,
      fontWeight: "700",
    },
    noteRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    note: {
      color: theme.textSecondary,
      fontSize: 12,
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 통과. (`accentSoftBg`는 `Theme` 타입에 존재 — `src/theme/theme.ts` 참고.)

- [ ] **Step 3: Commit**

```bash
git add src/screens/PremiumIntroScreen/slides/DeviceSyncSlide.tsx
git commit -m "feat(premium-intro): 기기 동기화 소개 슬라이드 추가"
```

---

## Task 7: TitlesSlide (실제 BadgeMedal 재사용)

뱃지 메달 그리드 6개를 실제 `BadgeMedal` 컴포넌트로 보여준다. 데모용이라 `MedalConfig`를 직접 하드코딩한다(뱃지 평가 로직에 의존하지 않음).

**Files:**
- Create: `src/screens/PremiumIntroScreen/slides/TitlesSlide.tsx`

- [ ] **Step 1: TitlesSlide 작성**

`src/screens/PremiumIntroScreen/slides/TitlesSlide.tsx`:

```tsx
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { MedalConfig } from "../../../features/badges/badgeVisuals";
import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";
import BadgeMedal from "../../TitlesScreen/BadgeMedal";
import SlideFrame from "./SlideFrame";

// 호칭·마일스톤 소개 슬라이드. 실제 BadgeMedal을 하드코딩한 MedalConfig로 재사용한다.
type DemoBadge = { config: MedalConfig; labelKey: string };

const DEMO_BADGES: readonly DemoBadge[] = [
  { config: { stage: "gold", content: { kind: "emoji", emoji: "🥇" } }, labelKey: "premiumIntro.slides.titles.b1" },
  { config: { stage: "silver", content: { kind: "emoji", emoji: "✈️" } }, labelKey: "premiumIntro.slides.titles.b2" },
  { config: { stage: "bronze", content: { kind: "emoji", emoji: "🗺️" } }, labelKey: "premiumIntro.slides.titles.b3" },
  { config: { stage: "p2", content: { kind: "emoji", emoji: "🌏" } }, labelKey: "premiumIntro.slides.titles.b4" },
  { config: { stage: "silver", content: { kind: "emoji", emoji: "🏔️" } }, labelKey: "premiumIntro.slides.titles.b5" },
  { config: { stage: "gold", content: { kind: "emoji", emoji: "🎖️" } }, labelKey: "premiumIntro.slides.titles.b6" },
];

export default function TitlesSlide() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <SlideFrame
      icon="🏅"
      iconBg="#e0e3ff"
      title={t("premiumIntro.slides.titles.title")}
      desc={t("premiumIntro.slides.titles.desc")}
    >
      <View style={styles.grid}>
        {DEMO_BADGES.map((b) => (
          <View key={b.labelKey} style={styles.cell}>
            <BadgeMedal config={b.config} size={44} />
            <Text style={styles.label} numberOfLines={1}>
              {t(b.labelKey)}
            </Text>
          </View>
        ))}
      </View>
    </SlideFrame>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      rowGap: 16,
    },
    cell: {
      width: "33.33%",
      alignItems: "center",
      gap: 6,
    },
    label: {
      color: theme.textPrimary,
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 통과. (`MedalConfig` = `{ stage: BadgeStage; content: MedalContent }`, `BadgeStage`는 `"entry"|"bronze"|"silver"|"gold"|"p1"|"p2"|"p3"|"p4"`, `MedalContent`는 `{ kind: "emoji"; emoji: string }` 허용 — `src/features/badges/badgeVisuals.ts` 참고. `BadgeMedal`의 props는 `config`, 선택적 `size`/`locked`.)

- [ ] **Step 3: Commit**

```bash
git add src/screens/PremiumIntroScreen/slides/TitlesSlide.tsx
git commit -m "feat(premium-intro): 호칭·마일스톤 소개 슬라이드 추가"
```

---

## Task 8: MapStyleSlide (실제 PalettePicker + MapThemeLockRow 재사용)

도트 팔레트 스와치와 지도 테마 세그먼트를 실제 컴포넌트로 보여준다. 데모용이라 `onSelect`는 no-op.

**Files:**
- Create: `src/screens/PremiumIntroScreen/slides/MapStyleSlide.tsx`

- [ ] **Step 1: MapStyleSlide 작성**

`src/screens/PremiumIntroScreen/slides/MapStyleSlide.tsx`:

```tsx
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { getCurrentLocale } from "../../../i18n";
import type { MapPalette } from "../../../theme/mapPalettes";
import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";
import MapThemeLockRow from "../../MapAppearanceScreen/MapThemeLockRow";
import PalettePicker from "../../MapAppearanceScreen/PalettePicker";
import SlideFrame from "./SlideFrame";

// 지도 스타일 소개 슬라이드. 실제 PalettePicker / MapThemeLockRow를 재사용하되
// 선택 콜백은 no-op (보여주기용).
export default function MapStyleSlide() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isKo = getCurrentLocale() === "ko";

  const labelOf = (palette: MapPalette) => (isKo ? palette.labelKo : palette.labelEn);
  const previewMode: "light" | "dark" = theme.statusBar === "light" ? "dark" : "light";

  return (
    <SlideFrame
      icon="🎨"
      iconBg="#efddff"
      title={t("premiumIntro.slides.mapStyle.title")}
      desc={t("premiumIntro.slides.mapStyle.desc")}
    >
      <View style={styles.wrap}>
        <PalettePicker
          theme={theme}
          previewMode={previewMode}
          currentId="green"
          labelOf={labelOf}
          onSelect={() => {}}
        />
        <MapThemeLockRow
          theme={theme}
          current="system"
          options={[
            { value: "system", label: t("mapAppearance.lock.system") },
            { value: "light", label: t("mapAppearance.lock.light") },
            { value: "dark", label: t("mapAppearance.lock.dark") },
          ]}
          onSelect={() => {}}
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {t("premiumIntro.slides.mapStyle.premiumOnly")}
          </Text>
        </View>
      </View>
    </SlideFrame>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    wrap: { gap: 14 },
    badge: {
      alignSelf: "center",
      backgroundColor: theme.accent,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: {
      color: theme.accentOn,
      fontSize: 11,
      fontWeight: "700",
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 통과. (`PalettePicker` props: `theme`, `previewMode: "light"|"dark"`, `currentId: string`, `labelOf: (p: MapPalette) => string`, `onSelect: (id: string) => void`. `MapThemeLockRow` props: `theme`, `current: MapThemeLock`, `options: { value: MapThemeLock; label: string }[]`, `onSelect: (v: MapThemeLock) => void`. `getCurrentLocale`는 `src/i18n/index.ts`에서 export됨. `mapAppearance.lock.*` 키는 ko.json에 이미 존재.)

- [ ] **Step 3: Commit**

```bash
git add src/screens/PremiumIntroScreen/slides/MapStyleSlide.tsx
git commit -m "feat(premium-intro): 지도 스타일 소개 슬라이드 추가"
```

---

## Task 9: PremiumIntroFooter (CTA + 보조 링크)

하단 고정 푸터: "구독 안내 보기" 기본 버튼 + "나중에 할게요" 보조 텍스트 링크.

**Files:**
- Create: `src/screens/PremiumIntroScreen/PremiumIntroFooter.tsx`

- [ ] **Step 1: PremiumIntroFooter 작성**

`src/screens/PremiumIntroScreen/PremiumIntroFooter.tsx`:

```tsx
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";

import type { Theme } from "../../theme/theme";
import { useTheme } from "../../theme/themeStore";

type Props = {
  onPressCta: () => void;
  onPressLater: () => void;
};

// 프리미엄 안내 페이지 하단 고정 푸터.
// 기본 CTA: 구독 안내 화면으로 이동 / 보조 링크: 안내를 닫고 채팅으로.
export default function PremiumIntroFooter({ onPressCta, onPressLater }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <>
      <Pressable
        onPress={onPressCta}
        style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>{t("premiumIntro.footer.cta")}</Text>
      </Pressable>
      <Pressable
        onPress={onPressLater}
        style={({ pressed }) => (pressed ? styles.laterPressed : null)}
        accessibilityRole="button"
        hitSlop={8}
      >
        <Text style={styles.laterText}>{t("premiumIntro.footer.later")}</Text>
      </Pressable>
    </>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    cta: {
      backgroundColor: theme.accent,
      borderRadius: 999,
      paddingVertical: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaPressed: { opacity: 0.85 },
    ctaText: {
      color: theme.accentOn,
      fontSize: 16,
      fontWeight: "700",
    },
    laterPressed: { opacity: 0.6 },
    laterText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
      textDecorationLine: "underline",
      marginTop: 12,
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 통과.

- [ ] **Step 3: Commit**

```bash
git add src/screens/PremiumIntroScreen/PremiumIntroFooter.tsx
git commit -m "feat(premium-intro): 하단 CTA·보조 링크 푸터 추가"
```

---

## Task 10: PremiumIntroScreen (캐러셀 컨테이너)

슬라이드 4개를 가로 paging ScrollView로 묶고, 하단에 `PagingDots` + `PremiumIntroFooter`를 고정한다. 마운트 시 `markSeen()`을 호출한다.

**Files:**
- Create: `src/screens/PremiumIntroScreen/styles.ts`
- Create: `src/screens/PremiumIntroScreen/index.tsx`

- [ ] **Step 1: styles.ts 작성**

`src/screens/PremiumIntroScreen/styles.ts`:

```typescript
import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
    },
    carousel: {
      flex: 1,
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 4,
      gap: 0,
    },
  });
}
```

- [ ] **Step 2: index.tsx 작성**

`src/screens/PremiumIntroScreen/index.tsx`:

```tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";

import { usePremiumIntroStore } from "../../features/premiumIntro/premiumIntroStore";
import { useScreenBottomInset } from "../../hooks/useScreenInsets";
import { useTheme } from "../../theme/themeStore";
import PagingDots from "./PagingDots";
import PremiumIntroFooter from "./PremiumIntroFooter";
import { makeStyles } from "./styles";
import AiChatSlide from "./slides/AiChatSlide";
import DeviceSyncSlide from "./slides/DeviceSyncSlide";
import MapStyleSlide from "./slides/MapStyleSlide";
import TitlesSlide from "./slides/TitlesSlide";

type Props = {
  /** "구독 안내 보기" — 구독 화면으로 이동. */
  onGoToSubscription: () => void;
  /** "나중에 할게요" — 안내를 닫고 채팅으로. */
  onDismiss: () => void;
};

const SLIDE_COUNT = 4;

// 프리미엄 기능 안내 페이지. 슬라이드 4개를 가로 paging으로 보여주고
// 하단에 점 인디케이터 + 고정 CTA를 둔다. 마운트되는 순간 "본 적 있음"으로 기록한다.
export default function PremiumIntroScreen({ onGoToSubscription, onDismiss }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const bottomInset = useScreenBottomInset();
  const markSeen = usePremiumIntroStore((s) => s.markSeen);
  const [activeIndex, setActiveIndex] = useState(0);

  // 마운트 시 1회만 "본 적 있음"으로 기록한다. 이후 AI 탭은 가로채지 않는다.
  useEffect(() => {
    void markSeen();
  }, [markSeen]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.min(Math.max(index, 0), SLIDE_COUNT - 1));
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.carousel}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        <View style={{ width }}>
          <AiChatSlide />
        </View>
        <View style={{ width }}>
          <DeviceSyncSlide />
        </View>
        <View style={{ width }}>
          <TitlesSlide />
        </View>
        <View style={{ width }}>
          <MapStyleSlide />
        </View>
      </ScrollView>

      <PagingDots count={SLIDE_COUNT} activeIndex={activeIndex} />

      <View style={[styles.footer, { paddingBottom: bottomInset + 20 }]}>
        <PremiumIntroFooter
          onPressCta={onGoToSubscription}
          onPressLater={onDismiss}
        />
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: 통과.

- [ ] **Step 4: 전체 테스트 스위트 확인**

Run: `npm test`
Expected: 기존 테스트 + Task 1의 `premiumIntroStore` 테스트 모두 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/screens/PremiumIntroScreen/styles.ts src/screens/PremiumIntroScreen/index.tsx
git commit -m "feat(premium-intro): 프리미엄 안내 캐러셀 화면 조립"
```

---

## Task 11: 네비게이션 통합 (types · RootNavigator · ScreenNav · MainTabs)

`PremiumIntro`를 RootStack에 등록하고, AI 탭 `tabPress`를 가로채 무료·미열람 사용자를 이 화면으로 보낸다.

**Files:**
- Modify: `src/navigation/types.ts`
- Create: `src/navigation/screens/PremiumIntroScreenNav.tsx`
- Modify: `src/navigation/RootNavigator.tsx`
- Modify: `src/navigation/MainTabs.tsx`

- [ ] **Step 1: types.ts — RootStackParamList 수정**

`src/navigation/types.ts` 상단 import에 추가:

```typescript
import type { NavigatorScreenParams } from "@react-navigation/native";
```

`RootStackParamList`에서 `Main` 줄을 교체하고 `PremiumIntro`를 추가:

```typescript
export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  AddTrip: { prefilledCountry?: { code: string; name: string } } | undefined;
  ChangeHome: undefined;
  Titles: undefined;
  Milestones: undefined;
  MapZoom: undefined;
  CountryDetail: undefined;
  TripDetail: { trip: RecentTrip };
  EditTrip: { trip: RecentTrip };
  History: undefined;
  ReviewSuspect: undefined;
  Language: undefined;
  MapAppearance: undefined;
  Subscription: undefined;
  PremiumIntro: undefined;
  CountryMerge: { countryCode: string };
  ImageDetail: {
    photos: ImageDetailPhoto[];
    initialIndex: number;
    title: string;
    flag: string;
  };
};
```

(`MainTabParamList`는 같은 파일에 이미 정의돼 있으므로 추가 import 불필요.)

- [ ] **Step 2: PremiumIntroScreenNav.tsx 작성**

`src/navigation/screens/PremiumIntroScreenNav.tsx`:

```tsx
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import PremiumIntroScreen from "../../screens/PremiumIntroScreen";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function PremiumIntroScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "PremiumIntro">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <PremiumIntroScreen
        onGoToSubscription={() => navigation.replace("Subscription")}
        onDismiss={() => navigation.navigate("Main", { screen: "AI" })}
      />
    </>
  );
}
```

- [ ] **Step 3: RootNavigator.tsx — 스크린 등록**

`src/navigation/RootNavigator.tsx` import 묶음에 추가:

```typescript
import PremiumIntroScreenNav from "./screens/PremiumIntroScreenNav";
```

`<Stack.Screen name="Subscription" ... />` 바로 뒤에 추가:

```tsx
        <Stack.Screen
          name="PremiumIntro"
          component={PremiumIntroScreenNav}
          options={{ animation: "slide_from_bottom" }}
        />
```

- [ ] **Step 4: MainTabs.tsx — AI 탭 tabPress 가로채기**

`src/navigation/MainTabs.tsx` import 묶음에 추가:

```typescript
import { usePremiumIntroStore } from "../features/premiumIntro/premiumIntroStore";
import { useSubscriptionStore } from "../features/subscription/subscriptionStore";
```

AI `Tab.Screen`에 `listeners`를 추가한다. 기존:

```tsx
      <Tab.Screen
        name="AI"
        component={AiScreenNav}
        options={{
          tabBarLabel: t("tabs.ai"),
          tabBarIcon: ({ color, size }) => (
            <BotMessageSquare color={color} size={size} />
          ),
        }}
      />
```

교체:

```tsx
      <Tab.Screen
        name="AI"
        component={AiScreenNav}
        options={{
          tabBarLabel: t("tabs.ai"),
          tabBarIcon: ({ color, size }) => (
            <BotMessageSquare color={color} size={size} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // 무료 + 아직 안 본 사용자만: 채팅 진입을 막고 프리미엄 안내로 보낸다.
            const { hydrated, seen } = usePremiumIntroStore.getState();
            const tier = useSubscriptionStore.getState().tier;
            if (hydrated && !seen && tier === "free") {
              e.preventDefault();
              navigation.getParent()?.navigate("PremiumIntro");
            }
          },
        })}
      />
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: 통과.

만약 `navigation.getParent()?.navigate("PremiumIntro")`에서 타입 에러가 나면, `MainTabs.tsx` import에 다음을 추가하고:

```typescript
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
```

호출부를 다음으로 교체한다:

```tsx
              e.preventDefault();
              navigation
                .getParent<NativeStackNavigationProp<RootStackParamList>>()
                ?.navigate("PremiumIntro");
```

- [ ] **Step 6: 전체 테스트 스위트 확인**

Run: `npm test`
Expected: 모든 테스트 PASS.

- [ ] **Step 7: Commit**

```bash
git add src/navigation/types.ts src/navigation/screens/PremiumIntroScreenNav.tsx src/navigation/RootNavigator.tsx src/navigation/MainTabs.tsx
git commit -m "feat(premium-intro): AI 탭 진입 가로채기·네비게이션 연결"
```

---

## Task 12: 수동 검증

실기기/시뮬레이터에서 동작을 확인한다. (preview 도구는 RN 네이티브 앱에 적용되지 않으므로 수동 확인이 필요하다 — 검증 불가 시 그 사실을 명시할 것.)

- [ ] **Step 1: 앱 실행**

`/howtorun` 스킬 안내에 따라 사용자가 직접 실행하거나, 이미 실행 중인 dev 빌드를 사용한다.

- [ ] **Step 2: 무료 사용자 첫 진입 확인**

- AsyncStorage가 깨끗한 상태(또는 재설치)에서 로그인 → 무료 tier
- 하단 AI(채팅) 탭을 처음 탭
- 기대: 채팅이 아니라 프리미엄 기능 안내 페이지가 아래에서 위로 슬라이드되어 뜬다
- 좌우로 스와이프 → 슬라이드 4개(AI 채팅 / 기기 동기화 / 호칭·마일스톤 / 지도 스타일)가 순서대로 보이고 하단 점 인디케이터가 따라 움직인다
- 각 슬라이드에 아이콘+제목, 한 줄 설명, 데모 UI가 보인다

- [ ] **Step 3: "나중에 할게요" 경로 확인**

- 하단 "나중에 할게요" 링크 탭
- 기대: 안내 페이지가 닫히고 AI 탭(채팅 화면)이 활성화된다
- 다시 AI 탭을 탭 → 기대: 안내 페이지 없이 바로 채팅 화면

- [ ] **Step 4: "구독 안내 보기" 경로 확인 (재설치 또는 스토리지 초기화 후 재현)**

- 안내 페이지에서 하단 "구독 안내 보기" 버튼 탭
- 기대: 기존 구독 안내(SubscriptionScreen)로 이동
- 구독 화면을 닫고 다시 AI 탭 탭 → 기대: 안내 페이지 없이 바로 채팅

- [ ] **Step 5: 유료 사용자 확인**

- 유료(premium) tier 계정으로 (스토리지 초기화 후) AI 탭 탭
- 기대: 안내 페이지 없이 바로 채팅 화면 (가로채기 안 함)

- [ ] **Step 6: 결과 보고**

검증 결과를 사용자에게 보고한다. 확인 못 한 항목이 있으면 "확인 불가"로 명시한다.

---

## Self-Review

**1. Spec coverage**
- 대상(무료만): Task 11 Step 4 `tier === "free"` 가드 ✓
- 트리거(AI 탭 tabPress): Task 11 Step 4 ✓
- "딱 한 번"(마운트 시 markSeen): Task 10 Step 2 `useEffect` + Task 1 store ✓
- 이탈 경로(CTA replace / 보조 링크 navigate Main>AI): Task 9 + Task 11 Step 2 ✓
- 네비게이션 통합(types/RootNavigator/ScreenNav/MainTabs): Task 11 ✓
- 영속화(zustand+AsyncStorage, onboardingStore 패턴): Task 1 ✓
- App.tsx hydrate 게이트: Task 2 ✓
- 화면 구조/파일 분리: Task 4·5·6·7·8·9·10 ✓
- 슬라이드별 데모(혼합 충실도): Task 5(실제 AiChatBubble)·6(목업)·7(실제 BadgeMedal)·8(실제 PalettePicker/MapThemeLockRow) ✓
- i18n(ko+en, 나머지 폴백): Task 3 ✓
- 엣지 케이스(유료 전환/재설치/구독 갔다옴/tier null): Task 11 가드는 `hydrated && !seen && tier === "free"` — tier가 `null`이면 가로채지 않음(엣지 케이스 충족), Task 12 Step 4·5 수동 검증 ✓

**2. Placeholder scan:** "TBD/TODO/적절히/나중에" 없음. 모든 코드 스텝에 실제 코드 포함. ✓

**3. Type consistency**
- `usePremiumIntroStore` 상태 `{ hydrated, seen, hydrate, markSeen }` — Task 1 정의, Task 2/10/11에서 동일하게 사용 ✓
- `PremiumIntroScreen` props `{ onGoToSubscription, onDismiss }` — Task 10 정의, Task 11 Step 2에서 동일 ✓
- `SlideFrame` props `{ icon, iconBg, title, desc, children }` — Task 4 정의, Task 5~8에서 동일 ✓
- `PremiumIntroFooter` props `{ onPressCta, onPressLater }` — Task 9 정의, Task 10에서 동일 ✓
- `PagingDots` props `{ count, activeIndex }` — Task 4 정의, Task 10에서 동일 ✓
- `MedalConfig` / `BadgeMedal` / `PalettePicker` / `MapThemeLockRow` / `AiChatBubble` / `ChatMessage` — 모두 기존 코드의 실제 시그니처와 대조 완료 ✓

---

## 변경/추가 파일 요약

**신규 (12)**
- `src/features/premiumIntro/premiumIntroStore.ts` + `.test.ts`
- `src/screens/PremiumIntroScreen/{index.tsx,styles.ts,PagingDots.tsx,PremiumIntroFooter.tsx}`
- `src/screens/PremiumIntroScreen/slides/{SlideFrame,AiChatSlide,DeviceSyncSlide,TitlesSlide,MapStyleSlide}.tsx`
- `src/navigation/screens/PremiumIntroScreenNav.tsx`

**수정 (5)**
- `App.tsx`, `src/navigation/types.ts`, `src/navigation/RootNavigator.tsx`, `src/navigation/MainTabs.tsx`, `src/i18n/locales/{ko,en}.json`
