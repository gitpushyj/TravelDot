# 온보딩 플로우 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 첫 실행 사용자에게 5단계 progress bar 기반의 통합 온보딩(Welcome → Login → Home country → Sync → Suspect review)을 제공하고, 한 번 완료한 사용자는 다음 실행부터 메인으로 직행하도록 만든다.

**Architecture:** `useOnboardingStore`(AsyncStorage 영속)에 완료 플래그를 두고 App.tsx에서 최우선 분기. `src/screens/Onboarding/` 폴더에 step 단위 단일 책임 파일을 두고 진행률 바와 step switcher를 `index.tsx`에 둔다. 기존 store(`useAuthStore`, `useVisitStore`)와 기존 데이터 흐름(`runFullSync`, `acceptSuspectTrips` 등)을 그대로 재사용한다.

**Tech Stack:** React Native 0.81 + Expo 54, TypeScript, zustand, AsyncStorage, react-i18next, react-native-reanimated, expo-media-library.

**Verification:** 본 프로젝트에는 단위 테스트 인프라가 없다. 각 task는 (a) TypeScript 타입체크 (`npx tsc --noEmit`), (b) Metro 번들러 시작(`npm run start`), (c) 명시된 수동 시나리오로 검증한다.

**참조 spec:** `docs/superpowers/specs/2026-05-07-onboarding-flow-design.md`

---

## File Structure

생성할 파일:

```
src/features/onboarding/onboardingStore.ts
src/screens/Onboarding/index.tsx
src/screens/Onboarding/OnboardingProgress.tsx
src/screens/Onboarding/WelcomeStep.tsx
src/screens/Onboarding/LoginStep.tsx
src/screens/Onboarding/HomeCountryStep.tsx
src/screens/Onboarding/SyncStep.tsx
src/screens/Onboarding/SuspectTripsStep.tsx
src/screens/Onboarding/styles.ts
```

수정할 파일:

```
App.tsx                       (분기 로직 교체)
src/i18n/locales/ko.json      (onboarding.* 키 추가)
src/i18n/locales/en.json      (onboarding.* 키 추가)
```

각 step 파일은 한 컴포넌트만 export. styles.ts는 step들이 공유하는 헤더·푸터·버튼·배너 스타일을 모은다.

---

## Task 1: useOnboardingStore 추가

**Files:**
- Create: `src/features/onboarding/onboardingStore.ts`

- [ ] **Step 1: 파일 작성**

`src/features/onboarding/onboardingStore.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "visitgrid:onboarding:completed_v1";

type State = {
  hydrated: boolean;
  completed: boolean;
  hydrate: () => Promise<void>;
  markCompleted: () => Promise<void>;
};

export const useOnboardingStore = create<State>((set) => ({
  hydrated: false,
  completed: false,
  hydrate: async () => {
    let stored: string | null = null;
    try {
      stored = await AsyncStorage.getItem(STORAGE_KEY);
    } catch {}
    set({ hydrated: true, completed: stored === "1" });
  },
  markCompleted: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    set({ completed: true });
  },
}));
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ocean.view/dev/VisitGrid && npx tsc --noEmit`
Expected: PASS (새 파일에 대한 에러 없음)

- [ ] **Step 3: 커밋**

```bash
git add src/features/onboarding/onboardingStore.ts
git commit -m "feat: 온보딩 완료 플래그용 onboardingStore 추가"
```

---

## Task 2: i18n 키 추가 (ko)

**Files:**
- Modify: `src/i18n/locales/ko.json`

- [ ] **Step 1: 최상위에 onboarding 객체 추가**

기존 ko.json의 가장 마지막 `}` 직전에, 마지막 키 뒤에 콤마를 붙이고 다음 블록을 추가한다.

```json
"onboarding": {
  "welcome": {
    "title": "사진으로 그리는 여행 기록",
    "point1": "휴대폰 사진의 GPS 정보로 어디를 다녀왔는지 자동으로 알아차려요",
    "point2": "직접 입력 없이 여행이 정리되고 지도가 채워져요",
    "point3": "사진은 휴대폰 밖으로 나가지 않아 안전해요",
    "next": "다음"
  },
  "login": {
    "title": "VisitGrid를 시작할게요",
    "subtitle": "기록을 기기에 안전하게 저장하기 위해 로그인해 주세요"
  },
  "home": {
    "title": "본국을 골라주세요",
    "subtitle": "본국 도트는 일수와 무관하게 파란색으로 표시됩니다.\n외국은 방문 일수만큼 색상이 진해져요."
  },
  "sync": {
    "title": "여행 기록을 동기화할게요",
    "body": "휴대폰 사진을 살펴서 자동으로 여행 기록을 만들어 드릴게요.",
    "fullAccessHint": "원활한 자동 기록을 위해 \"전체 사진 접근 허용\"을 선택해 주세요.",
    "button": "동기화 하기",
    "scanning": "사진 {{processed}}장 확인 중...",
    "preparing": "사진을 살펴볼 준비를 하고 있어요...",
    "limitedHint": "선택한 사진만 분석되고 있어요. 더 많은 여행을 찾으려면 설정에서 전체 허용으로 변경할 수 있어요.",
    "permissionDeniedTitle": "사진 접근 권한이 필요해요",
    "permissionDeniedBody": "여행 기록을 만들려면 사진 접근 권한이 필요해요. 권한을 허용한 후 다시 시도해 주세요.",
    "requestAgain": "권한 다시 요청"
  },
  "suspect": {
    "title": "확인이 필요한 여행이에요",
    "subtitle": "다른 기기로 찍힌 사진만 있는 여행이에요. 내 여행이 아닌게 있다면 기록에서 제거해주세요.",
    "allClearedTitle": "여행 기록 정리가 끝났어요",
    "allClearedBody": "확인이 필요한 여행은 없어요. 이제 지도에서 여행 기록을 살펴볼 수 있어요.",
    "acceptAll": "남은 여행은 모두 내 여행",
    "goHome": "홈으로 이동하기"
  }
}
```

- [ ] **Step 2: JSON 유효성 확인**

Run: `cd /Users/ocean.view/dev/VisitGrid && node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/ko.json','utf8'))"`
Expected: 출력 없음(파싱 성공). 에러가 나면 콤마/괄호 점검.

- [ ] **Step 3: 커밋**

```bash
git add src/i18n/locales/ko.json
git commit -m "i18n(ko): 온보딩 카피 추가"
```

---

## Task 3: i18n 키 추가 (en)

**Files:**
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: 최상위에 onboarding 객체 추가**

기존 en.json의 가장 마지막 `}` 직전에 다음 블록을 추가한다(콤마 처리 주의).

```json
"onboarding": {
  "welcome": {
    "title": "Your trips, drawn from your photos",
    "point1": "We read GPS data in your photos to find where you've been",
    "point2": "Trips appear automatically — no manual input needed",
    "point3": "Photos never leave your phone",
    "next": "Next"
  },
  "login": {
    "title": "Let's get started",
    "subtitle": "Sign in to keep your records safe on this device"
  },
  "home": {
    "title": "Choose your home country",
    "subtitle": "Your home dot is shown in blue regardless of days.\nForeign countries get darker the more days you spent there."
  },
  "sync": {
    "title": "Let's sync your trips",
    "body": "We'll go through your photos and build trip records automatically.",
    "fullAccessHint": "For best results, please choose \"Allow full photo access\".",
    "button": "Start sync",
    "scanning": "Reviewing {{processed}} photos...",
    "preparing": "Getting ready to scan your photos...",
    "limitedHint": "Only selected photos are being analyzed. Allow full access in Settings to find more trips.",
    "permissionDeniedTitle": "Photo access required",
    "permissionDeniedBody": "We need photo access to build your trip records. Please allow access and try again.",
    "requestAgain": "Request access again"
  },
  "suspect": {
    "title": "These trips need a quick check",
    "subtitle": "These trips only contain photos from another device. Remove any that aren't yours.",
    "allClearedTitle": "Your trips are all set",
    "allClearedBody": "Nothing needs review. You're ready to explore your map.",
    "acceptAll": "Keep all remaining",
    "goHome": "Go to home"
  }
}
```

- [ ] **Step 2: JSON 유효성 확인**

Run: `cd /Users/ocean.view/dev/VisitGrid && node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/en.json','utf8'))"`
Expected: 출력 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/i18n/locales/en.json
git commit -m "i18n(en): 온보딩 카피 추가"
```

---

## Task 4: 공통 styles.ts

**Files:**
- Create: `src/screens/Onboarding/styles.ts`

- [ ] **Step 1: 파일 작성**

`src/screens/Onboarding/styles.ts`:

```ts
import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export function makeOnboardingStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
    },
    progressWrap: {
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 8,
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.tabRowBg,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: theme.accent,
    },
    body: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: "800",
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 36,
    },
    primaryBtn: {
      backgroundColor: theme.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
    },
    primaryBtnPressed: { opacity: 0.85 },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
    },
    hintBox: {
      backgroundColor: theme.accentSoftBg,
      borderRadius: 12,
      padding: 14,
      marginTop: 20,
    },
    hintBoxText: {
      color: theme.accentSoftText,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600",
    },
    centerWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      gap: 14,
    },
    centerTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
      marginTop: 8,
      textAlign: "center",
    },
    centerBody: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
    },
    smallNote: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 17,
      textAlign: "center",
      marginTop: 12,
    },
  });
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ocean.view/dev/VisitGrid && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: 커밋**

```bash
git add src/screens/Onboarding/styles.ts
git commit -m "feat(onboarding): 공통 step 스타일 추가"
```

---

## Task 5: OnboardingProgress

**Files:**
- Create: `src/screens/Onboarding/OnboardingProgress.tsx`

- [ ] **Step 1: 파일 작성**

`src/screens/Onboarding/OnboardingProgress.tsx`:

```tsx
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, View } from "react-native";

import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";

type Props = {
  current: number; // 1..total
  total: number;
};

export default function OnboardingProgress({ current, total }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ratio = Math.max(0, Math.min(1, current / total));
    Animated.timing(value, {
      toValue: ratio,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [current, total, value]);

  const widthInterp = value.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: widthInterp }]} />
      </View>
    </View>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ocean.view/dev/VisitGrid && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: 커밋**

```bash
git add src/screens/Onboarding/OnboardingProgress.tsx
git commit -m "feat(onboarding): OnboardingProgress 컴포넌트 추가"
```

---

## Task 6: WelcomeStep

**Files:**
- Create: `src/screens/Onboarding/WelcomeStep.tsx`

- [ ] **Step 1: 파일 작성**

`src/screens/Onboarding/WelcomeStep.tsx`:

```tsx
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Circle, Path } from "react-native-svg";

import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";

type Props = { onNext: () => void };

export default function WelcomeStep({ onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);

  return (
    <>
      <View style={styles.body}>
        <View style={{ alignItems: "center", marginTop: 24, marginBottom: 24 }}>
          <Svg width={140} height={140} viewBox="0 0 140 140">
            <Circle
              cx={70}
              cy={70}
              r={56}
              stroke={theme.accent}
              strokeWidth={4}
              fill="none"
            />
            <Path
              d="M28 86 L54 60 L74 78 L96 50 L114 68"
              stroke={theme.accent}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={54} cy={60} r={4} fill={theme.accent} />
            <Circle cx={74} cy={78} r={4} fill={theme.accent} />
            <Circle cx={96} cy={50} r={4} fill={theme.accent} />
          </Svg>
        </View>
        <Text style={[styles.title, { textAlign: "center" }]}>
          {t("onboarding.welcome.title")}
        </Text>
        <View style={{ marginTop: 28, gap: 14 }}>
          <PointRow theme={theme} text={t("onboarding.welcome.point1")} />
          <PointRow theme={theme} text={t("onboarding.welcome.point2")} />
          <PointRow theme={theme} text={t("onboarding.welcome.point3")} />
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable
          onPress={onNext}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
          ]}
        >
          <Text style={styles.primaryBtnText}>{t("onboarding.welcome.next")}</Text>
        </Pressable>
      </View>
    </>
  );
}

function PointRow({
  theme,
  text,
}: {
  theme: ReturnType<typeof useTheme>;
  text: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.accent,
          marginTop: 7,
        }}
      />
      <Text
        style={{
          flex: 1,
          color: theme.textSecondary,
          fontSize: 15,
          lineHeight: 22,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ocean.view/dev/VisitGrid && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: 커밋**

```bash
git add src/screens/Onboarding/WelcomeStep.tsx
git commit -m "feat(onboarding): WelcomeStep 추가"
```

---

## Task 7: LoginStep

**Files:**
- Create: `src/screens/Onboarding/LoginStep.tsx`

- [ ] **Step 1: 파일 작성**

`src/screens/Onboarding/LoginStep.tsx`:

```tsx
import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../../features/auth/authStore";
import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";

type Props = { onNext: () => void };

export default function LoginStep({ onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);
  const localStyles = useMemo(() => makeLocalStyles(), []);

  const user = useAuthStore((s) => s.user);
  const signingIn = useAuthStore((s) => s.signingIn);
  const signInGoogle = useAuthStore((s) => s.signInGoogle);

  useEffect(() => {
    if (user) onNext();
  }, [user, onNext]);

  const onPressGoogle = async () => {
    const r = await signInGoogle();
    if (r.ok) return; // useEffect가 onNext 호출
    if (r.cancelled) return;
    Alert.alert(t("onboarding.login.title"), r.message);
  };

  return (
    <>
      <View style={styles.body}>
        <Text style={styles.title}>{t("onboarding.login.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.login.subtitle")}</Text>
      </View>
      <View style={styles.footer}>
        <Pressable
          onPress={onPressGoogle}
          disabled={signingIn}
          style={({ pressed }) => [
            localStyles.googleBtn,
            pressed && !signingIn && localStyles.googleBtnPressed,
            signingIn && { opacity: 0.6 },
          ]}
        >
          {signingIn ? (
            <ActivityIndicator color="#1a1a1a" />
          ) : (
            <>
              <Text style={localStyles.googleIcon}>G</Text>
              <Text style={localStyles.googleText}>Google로 계속하기</Text>
            </>
          )}
        </Pressable>
      </View>
    </>
  );
}

function makeLocalStyles() {
  return StyleSheet.create({
    googleBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      backgroundColor: "#ffffff",
      borderRadius: 14,
      paddingVertical: 14,
      width: "100%",
      minHeight: 52,
    },
    googleBtnPressed: { backgroundColor: "#e8e8e8" },
    googleIcon: {
      color: "#4285F4",
      fontSize: 20,
      fontWeight: "900",
    },
    googleText: {
      color: "#1a1a1a",
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ocean.view/dev/VisitGrid && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: 커밋**

```bash
git add src/screens/Onboarding/LoginStep.tsx
git commit -m "feat(onboarding): LoginStep 추가"
```

---

## Task 8: HomeCountryStep

**Files:**
- Create: `src/screens/Onboarding/HomeCountryStep.tsx`

- [ ] **Step 1: 파일 작성**

`src/screens/Onboarding/HomeCountryStep.tsx`:

```tsx
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import CountryPicker from "../../components/CountryPicker";
import { useVisitStore } from "../../features/travel/visitStore";
import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";

type Props = { onNext: () => void };

export default function HomeCountryStep({ onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);

  const setHomeCountry = useVisitStore((s) => s.setHomeCountry);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSelect = async (entry: {
    code: string;
    name: string;
    nameKo: string;
  }) => {
    if (submitting) return;
    Keyboard.dismiss();
    setSelectedCode(entry.code);
    setSubmitting(true);
    try {
      await setHomeCountry({ code: entry.code, name: entry.nameKo });
      onNext();
    } catch (e) {
      setSubmitting(false);
      Alert.alert("저장 실패", String(e));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.body, { paddingBottom: 0 }]}>
        <Text style={styles.title}>{t("onboarding.home.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.home.subtitle")}</Text>
      </View>
      <View style={localStyles.pickerWrap}>
        <CountryPicker onSelect={onSelect} selectedCode={selectedCode} />
        {submitting && (
          <View style={localStyles.overlay}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  pickerWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8, 14, 28, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ocean.view/dev/VisitGrid && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: 커밋**

```bash
git add src/screens/Onboarding/HomeCountryStep.tsx
git commit -m "feat(onboarding): HomeCountryStep 추가"
```

---

## Task 9: SyncStep

**Files:**
- Create: `src/screens/Onboarding/SyncStep.tsx`

- [ ] **Step 1: 파일 작성**

`src/screens/Onboarding/SyncStep.tsx`:

```tsx
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ensurePermission } from "../../features/photoSync/photoLibrary";
import { runFullSync } from "../../features/photoSync/syncService";
import { useVisitStore } from "../../features/travel/visitStore";
import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";

type Phase = "idle" | "syncing" | "denied";

type Props = { onNext: () => void };

export default function SyncStep({ onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);

  const syncStatus = useVisitStore((s) => s.syncStatus);
  const lastSync = useVisitStore((s) => s.lastSync);

  const [phase, setPhase] = useState<Phase>("idle");
  const [permission, setPermission] = useState<
    "granted" | "limited" | "denied" | null
  >(null);

  // 동기화가 끝나 lastSync가 채워지면 다음 step으로 이동.
  // permission이 denied면 SyncStep 안에서 머무른다.
  useEffect(() => {
    if (phase !== "syncing") return;
    if (!lastSync) return;
    if (lastSync.permission === "denied") {
      setPhase("denied");
      return;
    }
    onNext();
  }, [phase, lastSync, onNext]);

  const startSync = async () => {
    if (phase === "syncing") return;
    const result = await ensurePermission();
    setPermission(result);
    if (result === "denied") {
      setPhase("denied");
      return;
    }
    setPhase("syncing");
    runFullSync().catch(() => {
      // 실패는 lastSync.error로 보고된다. 여기서는 흡수.
    });
  };

  if (phase === "denied") {
    return (
      <>
        <View style={styles.body}>
          <Text style={styles.title}>
            {t("onboarding.sync.permissionDeniedTitle")}
          </Text>
          <Text style={styles.subtitle}>
            {t("onboarding.sync.permissionDeniedBody")}
          </Text>
        </View>
        <View style={styles.footer}>
          <Pressable
            onPress={startSync}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {t("onboarding.sync.requestAgain")}
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  if (phase === "syncing") {
    const processed = syncStatus.processed;
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator color={theme.accent} size="large" />
        <Text style={styles.centerTitle}>
          {processed > 0
            ? t("onboarding.sync.scanning", { processed })
            : t("onboarding.sync.preparing")}
        </Text>
        {permission === "limited" && (
          <Text style={styles.smallNote}>{t("onboarding.sync.limitedHint")}</Text>
        )}
      </View>
    );
  }

  // idle
  return (
    <>
      <View style={styles.body}>
        <Text style={styles.title}>{t("onboarding.sync.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.sync.body")}</Text>
        <View style={styles.hintBox}>
          <Text style={styles.hintBoxText}>
            {t("onboarding.sync.fullAccessHint")}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable
          onPress={startSync}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
          ]}
        >
          <Text style={styles.primaryBtnText}>{t("onboarding.sync.button")}</Text>
        </Pressable>
      </View>
    </>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ocean.view/dev/VisitGrid && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: 커밋**

```bash
git add src/screens/Onboarding/SyncStep.tsx
git commit -m "feat(onboarding): SyncStep 추가"
```

---

## Task 10: SuspectTripsStep

**Files:**
- Create: `src/screens/Onboarding/SuspectTripsStep.tsx`

- [ ] **Step 1: 파일 작성**

`src/screens/Onboarding/SuspectTripsStep.tsx`:

```tsx
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { LinearTransition } from "react-native-reanimated";

import type { SuspectTrip } from "../../features/photoSync/deviceVerification";
import { resolveDisplayUris } from "../../features/photoSync/photoLibrary";
import { loadPhotoUrisByIds } from "../../features/travel/visitRepository";
import { useVisitStore } from "../../features/travel/visitStore";
import { KO_NAME_BY_CODE } from "../../lib/countryLookup";
import SuspectRow from "../InitialScanScreen/SuspectRow";
import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";

const PREVIEW_PHOTO_LIMIT = 5;

type Props = { onFinish: () => void };

export default function SuspectTripsStep({ onFinish }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);

  const suspectTrips = useVisitStore((s) => s.suspectTrips);
  const rejectSuspectTrip = useVisitStore((s) => s.rejectSuspectTrip);
  const acceptSuspectTrip = useVisitStore((s) => s.acceptSuspectTrip);
  const acceptSuspectTrips = useVisitStore((s) => s.acceptSuspectTrips);
  const setLastSync = useVisitStore((s) => s.setLastSync);

  const [photoUris, setPhotoUris] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const ids: string[] = [];
    for (const trip of suspectTrips) {
      ids.push(...trip.photoIds.slice(0, PREVIEW_PHOTO_LIMIT));
    }
    if (ids.length === 0) {
      setPhotoUris({});
      return;
    }
    void (async () => {
      try {
        const stored = await loadPhotoUrisByIds(ids);
        const entries = Object.entries(stored).map(([id, uri]) => ({ id, uri }));
        const display = await resolveDisplayUris(entries);
        if (!cancelled) setPhotoUris(display);
      } catch {
        if (!cancelled) setPhotoUris({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [suspectTrips]);

  const handleReject = (trip: SuspectTrip) => {
    const koName = KO_NAME_BY_CODE[trip.countryCode] ?? trip.countryCode;
    Alert.alert(
      "내 여행 아님",
      `${koName} ${formatRange(trip.startDate, trip.endDate)} 여행을 기록에서 제거할까요?\n사진 ${trip.photoCount}장이 함께 정리됩니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "제거",
          style: "destructive",
          onPress: () => {
            void rejectSuspectTrip(trip);
          },
        },
      ]
    );
  };

  const handleAccept = (trip: SuspectTrip) => {
    void acceptSuspectTrip(trip);
  };

  const finish = async () => {
    if (suspectTrips.length > 0) {
      await acceptSuspectTrips(suspectTrips);
    }
    setLastSync(null);
    onFinish();
  };

  if (suspectTrips.length === 0) {
    return (
      <>
        <View style={styles.centerWrap}>
          <Text style={styles.centerTitle}>
            {t("onboarding.suspect.allClearedTitle")}
          </Text>
          <Text style={styles.centerBody}>
            {t("onboarding.suspect.allClearedBody")}
          </Text>
        </View>
        <View style={styles.footer}>
          <Pressable
            onPress={() => void finish()}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {t("onboarding.suspect.goHome")}
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.body, { paddingBottom: 0 }]}>
        <Text style={styles.title}>{t("onboarding.suspect.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.suspect.subtitle")}</Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
          gap: 12,
        }}
      >
        <Animated.View
          style={{ gap: 12 }}
          layout={LinearTransition.duration(260)}
        >
          {suspectTrips.map((trip) => {
            const previewUris = trip.photoIds
              .slice(0, PREVIEW_PHOTO_LIMIT)
              .map((id) => photoUris[id])
              .filter((u): u is string => !!u);
            return (
              <SuspectRow
                key={`${trip.countryCode}-${trip.startDate}-${trip.endDate}`}
                theme={theme}
                trip={trip}
                previewUris={previewUris}
                onReject={() => handleReject(trip)}
                onAccept={() => handleAccept(trip)}
              />
            );
          })}
        </Animated.View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          onPress={() => void finish()}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {t("onboarding.suspect.acceptAll")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return startDate;
  return `${startDate} ~ ${endDate}`;
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ocean.view/dev/VisitGrid && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: 커밋**

```bash
git add src/screens/Onboarding/SuspectTripsStep.tsx
git commit -m "feat(onboarding): SuspectTripsStep 추가"
```

---

## Task 11: OnboardingFlow (index.tsx)

**Files:**
- Create: `src/screens/Onboarding/index.tsx`

- [ ] **Step 1: 파일 작성**

`src/screens/Onboarding/index.tsx`:

```tsx
import React, { useEffect, useMemo, useState } from "react";
import { BackHandler, View } from "react-native";

import { useAuthStore } from "../../features/auth/authStore";
import { useOnboardingStore } from "../../features/onboarding/onboardingStore";
import { useVisitStore } from "../../features/travel/visitStore";
import { useTheme } from "../../theme/themeStore";

import HomeCountryStep from "./HomeCountryStep";
import LoginStep from "./LoginStep";
import OnboardingProgress from "./OnboardingProgress";
import { makeOnboardingStyles } from "./styles";
import SuspectTripsStep from "./SuspectTripsStep";
import SyncStep from "./SyncStep";
import WelcomeStep from "./WelcomeStep";

const TOTAL_STEPS = 5;

export default function OnboardingFlow() {
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);

  const authUser = useAuthStore((s) => s.user);
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  // 초기 step 결정: 이미 완료된 단계는 자동 skip.
  // welcome(1)은 항상 보여주는 게 자연스러우므로 welcome은 skip 대상에서 제외한다.
  const [step, setStep] = useState<number>(1);

  // 시스템 back 차단 (Android). 편도 플로우.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  // 외부 상태(예: 다른 디바이스에서 세션 복원, 잔존 homeCountry)를 보고
  // step을 앞당긴다. 뒤로 돌리지는 않는다.
  useEffect(() => {
    setStep((prev) => {
      let next = prev;
      if (next < 3 && authUser) next = 3;
      if (next < 4 && homeCountry) next = 4;
      return next;
    });
  }, [authUser, homeCountry]);

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));

  const finish = async () => {
    await markCompleted();
  };

  return (
    <View style={styles.root}>
      <OnboardingProgress current={step} total={TOTAL_STEPS} />
      {step === 1 && <WelcomeStep onNext={goNext} />}
      {step === 2 && <LoginStep onNext={goNext} />}
      {step === 3 && <HomeCountryStep onNext={goNext} />}
      {step === 4 && <SyncStep onNext={goNext} />}
      {step === 5 && <SuspectTripsStep onFinish={() => void finish()} />}
    </View>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ocean.view/dev/VisitGrid && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: 커밋**

```bash
git add src/screens/Onboarding/index.tsx
git commit -m "feat(onboarding): OnboardingFlow 진입점 추가"
```

---

## Task 12: App.tsx 분기 변경

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: 분기 로직 교체**

`App.tsx`를 다음으로 교체한다(전체 파일):

```tsx
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initI18n } from "./src/i18n";
import { useAuthStore } from "./src/features/auth/authStore";
import { useOnboardingStore } from "./src/features/onboarding/onboardingStore";
import { useVisitStore } from "./src/features/travel/visitStore";
import { useBadgeNotificationAlert } from "./src/hooks/useBadgeNotificationAlert";
import { useHomeCleanupAlert } from "./src/hooks/useHomeCleanupAlert";
import { useScanCompletionAlert } from "./src/hooks/useScanCompletionAlert";
import { AppCtxProvider, type AppNavCtx } from "./src/navigation/AppCtx";
import RootNavigator from "./src/navigation/RootNavigator";
import type { YearMode } from "./src/navigation/types";
import LoginScreen from "./src/screens/LoginScreen";
import OnboardingFlow from "./src/screens/Onboarding";
import {
  useSystemSchemeListener,
  useTheme,
  useThemeStore,
} from "./src/theme/themeStore";

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);
  const ready = useVisitStore((s) => s.ready);
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const hydrate = useVisitStore((s) => s.hydrate);
  const visitCounts = useVisitStore((s) => s.visitCounts);
  const visitCountsByYear = useVisitStore((s) => s.visitCountsByYear);
  const ensureYearCounts = useVisitStore((s) => s.ensureYearCounts);
  const themeHydrate = useThemeStore((s) => s.hydrate);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const authHydrate = useAuthStore((s) => s.hydrate);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const authUser = useAuthStore((s) => s.user);
  const onboardingHydrate = useOnboardingStore((s) => s.hydrate);
  const onboardingHydrated = useOnboardingStore((s) => s.hydrated);
  const onboardingCompleted = useOnboardingStore((s) => s.completed);
  const onboardingMarkCompleted = useOnboardingStore((s) => s.markCompleted);
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  useSystemSchemeListener();

  const [yearMode, setYearMode] = useState<YearMode>({ kind: "all" });

  useEffect(() => {
    void hydrate();
    void themeHydrate();
    void authHydrate();
    void onboardingHydrate();
    void initI18n().then(() => setI18nReady(true));
  }, [hydrate, themeHydrate, authHydrate, onboardingHydrate]);

  useEffect(() => {
    if (yearMode.kind === "year") {
      void ensureYearCounts(yearMode.year);
    }
  }, [yearMode, ensureYearCounts]);

  // 기존 사용자(이미 로그인 + 본국 설정 완료)는 자동으로 온보딩 완료 처리.
  // 단, hydrate가 모두 끝난 뒤 한 번만 실행하도록 가드한다.
  useEffect(() => {
    if (!ready || !authHydrated || !onboardingHydrated) return;
    if (onboardingCompleted) return;
    if (authUser && homeCountry) {
      void onboardingMarkCompleted();
    }
  }, [
    ready,
    authHydrated,
    onboardingHydrated,
    onboardingCompleted,
    authUser,
    homeCountry,
    onboardingMarkCompleted,
  ]);

  useScanCompletionAlert(false);
  useHomeCleanupAlert();
  useBadgeNotificationAlert();

  const activeCounts = useMemo(() => {
    if (yearMode.kind === "year") {
      return visitCountsByYear[yearMode.year] ?? {};
    }
    return visitCounts;
  }, [yearMode, visitCounts, visitCountsByYear]);

  if (
    !ready ||
    !themeHydrated ||
    !authHydrated ||
    !onboardingHydrated ||
    !i18nReady
  ) {
    return <View style={styles.root} />;
  }

  // 온보딩 미완료 → OnboardingFlow가 모든 단계를 책임진다.
  if (!onboardingCompleted) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style={theme.statusBar} />
        <OnboardingFlow />
      </GestureHandlerRootView>
    );
  }

  // 온보딩 완료 후 어떤 이유로든 로그아웃된 경우 LoginScreen만 노출.
  if (!authUser) {
    return (
      <GestureHandlerRootView style={styles.rootDark}>
        <StatusBar style="light" />
        <LoginScreen />
      </GestureHandlerRootView>
    );
  }

  const ctxValue: AppNavCtx = { yearMode, setYearMode, activeCounts };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppCtxProvider value={ctxValue}>
          <RootNavigator />
        </AppCtxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function makeStyles(theme: { homeBg: string }) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.homeBg },
    rootDark: { flex: 1 },
  });
}
```

주요 변경점:
- `pendingInitialScan` 상태 제거 (OnboardingFlow가 흡수).
- `useScanCompletionAlert` 인자: 기존엔 `pendingInitialScan` 였으나 OnboardingFlow 내부에서 자체적으로 처리하므로 `false` 고정. (해당 hook은 InitialScanScreen 종료 시 토스트를 띄우는 역할로, 신규 온보딩에서는 별도 안내가 있어 동일 토스트 중복을 막는다.)
- `OnboardingScreen` import 제거 (mode="initial" 경로 호출자 사라짐).
- `useOnboardingStore` 추가, hydrate 대기, 자동 markCompleted effect 추가.

- [ ] **Step 2: 타입체크**

Run: `cd /Users/ocean.view/dev/VisitGrid && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: 커밋**

```bash
git add App.tsx
git commit -m "feat(onboarding): App.tsx 분기를 OnboardingFlow 기반으로 교체"
```

---

## Task 13: 수동 검증

테스트 인프라가 없으므로 시뮬레이터/실기기에서 다음 시나리오를 직접 확인한다.

- [ ] **Step 1: Metro 시작 + iOS 시뮬레이터 빌드**

Run: `cd /Users/ocean.view/dev/VisitGrid && npm run ios`
Expected: 앱이 시뮬레이터에서 뜨고 콘솔에 빨간 에러가 없음.

- [ ] **Step 2: 신규 사용자 시나리오**

1. 시뮬레이터에서 앱 데이터 초기화 (Erase All Content & Settings 또는 앱 삭제 후 재설치).
2. 앱 실행 → Welcome step(progress 1/5)이 보이는지.
3. "다음" → Login step(progress 2/5).
4. Google 로그인 성공 → Home country step(progress 3/5)으로 자동 이동.
5. 본국 선택 → Sync step(progress 4/5)으로 자동 이동.
6. "동기화 하기" → 권한 요청 → 진행률 화면 → 완료 시 Suspect step(progress 5/5)으로 이동.
7. 의심 여행이 있으면 처리 후 "남은 여행은 모두 내 여행" / 없으면 "홈으로 이동하기" → 메인 화면 진입.
8. 앱을 강제 종료 후 재실행 → 곧바로 메인 화면으로 진입(온보딩 다시 안 뜸).

- [ ] **Step 3: 자동 skip 시나리오**

1. AsyncStorage의 `visitgrid:onboarding:completed_v1`만 콘솔로 지운 뒤 재실행 (또는 step 3 완료 후 강제종료):
2. OnboardingFlow가 다시 뜨되 이미 채워진 상태에 따라 알맞은 step(예: 4)부터 시작하는지.

- [ ] **Step 4: 권한 거부 시나리오**

1. 신규 사용자로 step 4 진입.
2. "동기화 하기" 누르고 권한 다이얼로그에서 "허용 안 함".
3. "사진 접근 권한이 필요해요" 화면이 뜨고 "권한 다시 요청" 외 옵션이 없는지.
4. 다시 누르면 시스템이 다이얼로그를 안 띄울 수 있음(이미 거부 기록). 시뮬레이터의 Privacy 설정에서 직접 허용 후 다시 누르면 진행되는지.

- [ ] **Step 5: 기존 사용자 시나리오**

1. 데이터를 그대로 둔 채(이미 로그인 + 본국 있음) 앱 첫 실행 시 OnboardingFlow가 보이지 않고 곧바로 메인으로 가는지.
2. AsyncStorage에 `visitgrid:onboarding:completed_v1` 키가 자동으로 `"1"`로 기록되는지(개발자 메뉴 또는 콘솔 로그 추가로 확인 가능).

- [ ] **Step 6: 검증 완료 후 마지막 커밋(없으면 skip)**

수정이 필요했다면 적절한 커밋 메시지로 마무리한다. 검증 단계에서 코드 수정이 없었다면 이 step은 skip.

---

## Self-Review

**Spec 커버리지:**

| Spec 요구사항 | 구현 task |
|--------------|-----------|
| 신규 사용자 5단계 progress bar 온보딩 | Task 5 (progress) + Task 6/7/8/9/10/11 (steps) |
| onboardingCompleted 플래그 영속 | Task 1 |
| 기존 사용자 자동 markCompleted | Task 12 (App.tsx effect) |
| step 2/3 자동 skip | Task 11 (OnboardingFlow useEffect) |
| step 1 Welcome 카피·아이콘 | Task 6 |
| step 2 Google 로그인 | Task 7 |
| step 3 본국 선택 + 부제 변경 | Task 8 + Task 2/3 (i18n) |
| step 4 동기화 + 전체 권한 안내 + limited 안내 | Task 9 |
| step 4 denied시 진행 불가 | Task 9 |
| step 5 의심 여행 / 모두 완료 + 홈 이동 | Task 10 |
| 편도(시스템 back 차단) | Task 11 |
| 기존 InitialScanScreen·OnboardingScreen 보존 | Task 12 (호출 제거만, 파일 보존) |

전 항목 매핑 완료. 누락 없음.

**플레이스홀더 스캔:** "TBD"·"TODO"·"적절히 처리"·"비슷하게" 없음. 모든 step에 실제 코드 포함.

**타입 일관성:**
- `onNext: () => void` 시그니처가 step 컴포넌트 4개에 동일하게 사용됨(Welcome/Login/HomeCountry/Sync).
- SuspectTripsStep만 종료를 의미하는 `onFinish`. index.tsx에서 정확히 그 이름으로 prop 전달.
- `useOnboardingStore` 멤버명: `hydrated`, `completed`, `hydrate`, `markCompleted` — Task 1 정의와 Task 11/12 사용처 일치.
- `Phase` 타입의 `"idle" | "syncing" | "denied"`는 SyncStep 내부에서만 사용, 외부 노출 없음.

검토 완료 — 추가 수정 없음.

---

## Execution Handoff

이 plan을 인라인으로 실행한다(현재 세션에서 step 단위로 적용 후 커밋).
