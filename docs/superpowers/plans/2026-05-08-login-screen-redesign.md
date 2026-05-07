# 로그인 화면 리디자인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 제공한 참조 이미지에 맞게 로그인 화면을 통합·리디자인하고, Google/Apple 로그인 버튼을 공식 가이드라인에 맞게 정비한다.

**Architecture:** 기존 `Onboarding/LoginStep`과 `LoginScreen`을 단일 컴포넌트로 통합한다. `WelcomeStep`은 LoginStep에 흡수되고 온보딩은 6→5단계로 축소된다. SVG 인증 아이콘과 재사용 가능한 버튼 컴포넌트를 분리해 두 경로(온보딩 + 재로그인)에서 동일한 시각/동작을 보장한다.

**Tech Stack:** React Native(Expo 54), TypeScript strict, react-native-svg, react-i18next, zustand. 테스트 프레임워크 없음 — `tsc` 타입체크 + 시뮬레이터 시각 검증으로 확인한다.

**Branding compliance basis:**
- Google "G" 로고는 Google Identity Branding Guidelines의 공식 4색 마크 SVG.
- Apple 심볼은 Apple HIG의 Sign in with Apple 가이드라인이 요구하는 형태.

---

## File Structure

신규:

- `src/components/auth/GoogleGIcon.tsx` — 공식 4색 G SVG 컴포넌트.
- `src/components/auth/AppleLogoIcon.tsx` — 공식 Apple 심볼 SVG 컴포넌트.
- `src/components/auth/GoogleSignInButton.tsx` — 흰 배경 + chevron 버튼.
- `src/components/auth/AppleSignInButton.tsx` — 검정 배경 + chevron 버튼.
- `src/components/auth/ChevronIcon.tsx` — 우측 화살표 SVG (재사용).
- `src/screens/Onboarding/LoginHero.tsx` — 좌측 텍스트 + 우측 hero 이미지.
- `src/screens/Onboarding/LoginDivider.tsx` — "또는" 디바이더.
- `src/screens/Onboarding/LoginFeatureCard.tsx` — 카드 1개 컴포넌트.
- `src/screens/Onboarding/LoginFeatureCards.tsx` — 카드 3개 가로 배치.
- `src/screens/Onboarding/loginFeatureIcons.tsx` — 카드용 아이콘 3종 SVG.

수정:

- `src/screens/Onboarding/LoginStep.tsx` — 위 컴포넌트로 새 레이아웃 구성.
- `src/screens/Onboarding/index.tsx` — `TOTAL_STEPS=5`, step 매핑 재정렬, `WelcomeStep` 제거.
- `App.tsx` — 로그아웃 분기에서 `LoginScreen` 대신 `LoginStep` 단독 렌더링.
- `src/i18n/locales/{ko,en,ja,zh-CN,zh-TW,de,fr,es,it,ru}.json` (10개) — 신규 i18n 키 추가.

삭제:

- `src/screens/LoginScreen.tsx`
- `src/screens/Onboarding/WelcomeStep.tsx`

---

## Verification approach

테스트 프레임워크가 없으므로 각 Phase 마지막에 다음 verification을 수행한다.

1. `npx tsc --noEmit` — 타입 에러 0건.
2. iOS 시뮬레이터 실행 → 시각 비교 + 인터랙션 점검.
3. Android 에뮬레이터 → Apple 버튼 hidden 확인.

본 plan은 task 단위로 commit한다.

---

### Task 1: Google 4색 G 아이콘 SVG 컴포넌트

**Files:**

- Create: `src/components/auth/GoogleGIcon.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/components/auth/GoogleGIcon.tsx
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = { size?: number };

// Google Identity 브랜딩 가이드라인의 공식 4색 G 마크.
// viewBox 48 기준의 표준 path. 색상·비율을 임의로 변경하지 않는다 — 변경 시 가이드 위반.
export default function GoogleGIcon({ size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/GoogleGIcon.tsx
git commit -m "feat(auth): 공식 Google 4색 G 아이콘 컴포넌트 추가"
```

---

### Task 2: Apple 심볼 SVG 컴포넌트

**Files:**

- Create: `src/components/auth/AppleLogoIcon.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/components/auth/AppleLogoIcon.tsx
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = { size?: number; color?: string };

// Apple HIG의 Sign in with Apple 가이드라인이 사용하는 표준 Apple 심볼 path.
// 검정 버튼에서는 color="#FFFFFF"로, 흰 버튼에서는 "#000000"로 사용한다.
export default function AppleLogoIcon({ size = 18, color = "#FFFFFF" }: Props) {
  return (
    <Svg width={size} height={size * (24 / 22)} viewBox="0 0 22 24" fill="none">
      <Path
        fill={color}
        d="M17.05 12.04c-.03-3.13 2.55-4.63 2.66-4.71-1.45-2.13-3.71-2.42-4.51-2.45-1.92-.19-3.74 1.13-4.71 1.13s-2.46-1.1-4.05-1.07c-2.08.03-4.02 1.21-5.09 3.07-2.18 3.78-.55 9.36 1.55 12.43 1.06 1.5 2.31 3.18 3.96 3.12 1.6-.07 2.2-1.03 4.13-1.03s2.47 1.03 4.16.99c1.72-.03 2.81-1.5 3.86-3.02 1.22-1.73 1.71-3.41 1.74-3.5-.04-.02-3.34-1.27-3.7-5.04zm-3.1-9.27c.86-1.05 1.45-2.5 1.29-3.95-1.25.05-2.78.84-3.67 1.88-.78.93-1.49 2.42-1.31 3.83 1.4.11 2.83-.71 3.69-1.76z"
      />
    </Svg>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/AppleLogoIcon.tsx
git commit -m "feat(auth): 공식 Apple 심볼 아이콘 컴포넌트 추가"
```

---

### Task 3: Chevron 아이콘 (버튼 우측 화살표)

**Files:**

- Create: `src/components/auth/ChevronIcon.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/components/auth/ChevronIcon.tsx
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = { size?: number; color?: string };

export default function ChevronIcon({ size = 18, color = "#9a948a" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
```

- [ ] **Step 2: 타입체크 + Commit**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

```bash
git add src/components/auth/ChevronIcon.tsx
git commit -m "feat(auth): 로그인 버튼용 chevron 아이콘 컴포넌트 추가"
```

---

### Task 4: GoogleSignInButton 재사용 컴포넌트

**Files:**

- Create: `src/components/auth/GoogleSignInButton.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/components/auth/GoogleSignInButton.tsx
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import ChevronIcon from "./ChevronIcon";
import GoogleGIcon from "./GoogleGIcon";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
};

export default function GoogleSignInButton({ label, onPress, loading }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.btn,
        pressed && !loading && styles.btnPressed,
        loading && styles.btnDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#1a1a1a" />
      ) : (
        <View style={styles.row}>
          <GoogleGIcon size={22} />
          <Text style={styles.label}>{label}</Text>
          <ChevronIcon size={18} color="#9a948a" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 56,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  btnPressed: { backgroundColor: "#f3efe6" },
  btnDisabled: { opacity: 0.6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    flex: 1,
    textAlign: "center",
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "700",
  },
});
```

- [ ] **Step 2: 타입체크 + Commit**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

```bash
git add src/components/auth/GoogleSignInButton.tsx
git commit -m "feat(auth): GoogleSignInButton 재사용 컴포넌트 추가"
```

---

### Task 5: AppleSignInButton 재사용 컴포넌트

**Files:**

- Create: `src/components/auth/AppleSignInButton.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/components/auth/AppleSignInButton.tsx
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import AppleLogoIcon from "./AppleLogoIcon";
import ChevronIcon from "./ChevronIcon";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
};

export default function AppleSignInButton({ label, onPress, loading }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.btn,
        pressed && !loading && styles.btnPressed,
        loading && styles.btnDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <View style={styles.row}>
          <AppleLogoIcon size={20} color="#FFFFFF" />
          <Text style={styles.label}>{label}</Text>
          <ChevronIcon size={18} color="#aaaaaa" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 56,
    width: "100%",
  },
  btnPressed: { backgroundColor: "#1f1f1f" },
  btnDisabled: { opacity: 0.6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    flex: 1,
    textAlign: "center",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
```

- [ ] **Step 2: 타입체크 + Commit**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

```bash
git add src/components/auth/AppleSignInButton.tsx
git commit -m "feat(auth): AppleSignInButton 재사용 컴포넌트 추가"
```

---

### Task 6: 카드용 아이콘 3종 SVG

**Files:**

- Create: `src/screens/Onboarding/loginFeatureIcons.tsx`

- [ ] **Step 1: 카드 아이콘 작성 (사진/지도/자물쇠)**

```tsx
// src/screens/Onboarding/loginFeatureIcons.tsx
import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = { size?: number; color: string };

export function PhotoFeatureIcon({ size = 28, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect x={3} y={6} width={22} height={17} rx={3} stroke={color} strokeWidth={2} />
      <Circle cx={14} cy={15} r={4} stroke={color} strokeWidth={2} />
      <Path d="M9 6l1.5-2h7L19 6" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

export function MapFeatureIcon({ size = 28, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M3 7l7-3 8 3 7-3v17l-7 3-8-3-7 3V7z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M10 4v17M18 7v17" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function LockFeatureIcon({ size = 28, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect x={5} y={12} width={18} height={12} rx={2.5} stroke={color} strokeWidth={2} />
      <Path
        d="M9 12V9a5 5 0 0110 0v3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={14} cy={18} r={1.6} fill={color} />
    </Svg>
  );
}
```

- [ ] **Step 2: 타입체크 + Commit**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

```bash
git add src/screens/Onboarding/loginFeatureIcons.tsx
git commit -m "feat(onboarding): 로그인 화면 카드용 아이콘 3종 추가"
```

---

### Task 7: i18n 키 추가 — 한국어/영어 (기준 언어)

**Files:**

- Modify: `src/i18n/locales/ko.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: ko.json 수정**

`onboarding.login` 객체에 카드/디바이더 키 추가:

```json
"login": {
  "title": "TravelDot을 시작할게요",
  "subtitle": "기록을 기기에 안전하게 저장하기 위해 로그인해 주세요",
  "dividerOr": "또는",
  "feature1": {
    "title": "사진으로 자동 기록",
    "desc": "위치·시간으로 일정이 자동 분류돼요"
  },
  "feature2": {
    "title": "한 번에 지도 색칠",
    "desc": "여행 끝내고 버튼 한 번이면 끝이에요"
  },
  "feature3": {
    "title": "기기에만 저장",
    "desc": "사진은 서버로 보내지 않아요"
  }
}
```

- [ ] **Step 2: en.json 수정**

```json
"login": {
  "title": "Let's get started",
  "subtitle": "Sign in to keep your records safe on this device",
  "dividerOr": "OR",
  "feature1": {
    "title": "Auto record from photos",
    "desc": "We classify trips by location and time"
  },
  "feature2": {
    "title": "One-tap map coloring",
    "desc": "Finish a trip, paint the map in one tap"
  },
  "feature3": {
    "title": "Stays on device",
    "desc": "Photos never leave your phone"
  }
}
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/ko.json src/i18n/locales/en.json
git commit -m "i18n(login): ko/en에 카드 3종 + 디바이더 텍스트 추가"
```

---

### Task 8: i18n 키 추가 — 나머지 8개 로케일

> 실제 로케일 파일은 총 10개(ko, en, ja, zh-CN, zh-TW, de, fr, es, it, ru). 사용자에게 11종이라 안내했으나 파일 점검 결과 10종이 정확. Task 7에서 ko/en을 처리했으므로 본 task에서는 나머지 8종을 갱신.

**Files:**

- Modify: `src/i18n/locales/ja.json`
- Modify: `src/i18n/locales/zh-CN.json`
- Modify: `src/i18n/locales/zh-TW.json`
- Modify: `src/i18n/locales/de.json`
- Modify: `src/i18n/locales/fr.json`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/it.json`
- Modify: `src/i18n/locales/ru.json`

- [ ] **Step 1: 8개 로케일 동일 구조로 키 추가**

각 파일의 `onboarding.login`에 동일한 6개 키(`dividerOr`, `feature1.title`, `feature1.desc`, `feature2.title`, `feature2.desc`, `feature3.title`, `feature3.desc`)를 자연스러운 번역으로 추가. 번역 가이드:

- `dividerOr`: "또는"의 자연스러운 번역(예: ja "または", de "ODER", fr "OU", es "O", it "O", ru "ИЛИ", zh "或").
- 카드 제목은 짧게(8자 이내 권장), 설명은 한 줄(15자 내외).
- 의미 보존: feature1=자동 분류, feature2=원클릭 시각화, feature3=기기 보관.

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

- [ ] **Step 3: 모든 로케일이 동일 키 트리를 갖는지 점검**

Run: `node -e "const f=require('fs');const d='src/i18n/locales';for(const n of f.readdirSync(d)){const j=JSON.parse(f.readFileSync(d+'/'+n));const k=j.onboarding?.login;console.log(n, !!k?.dividerOr, !!k?.feature1?.title, !!k?.feature3?.desc);}"`
Expected: 10개 로케일 모두 `true true true`.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/
git commit -m "i18n(login): 나머지 8개 로케일에 카드/디바이더 텍스트 추가"
```

---

### Task 9: LoginHero 컴포넌트 (좌측 텍스트 + 우측 이미지)

**Files:**

- Create: `src/screens/Onboarding/LoginHero.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/screens/Onboarding/LoginHero.tsx
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  title: string;
  subtitle: string;
};

export default function LoginHero({ theme, title, subtitle }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      <Image
        source={require("../../../assets/login_image.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  left: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  image: {
    width: 150,
    height: 150,
  },
});
```

- [ ] **Step 2: 타입체크 + Commit**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

```bash
git add src/screens/Onboarding/LoginHero.tsx
git commit -m "feat(onboarding): LoginHero 컴포넌트 추가"
```

---

### Task 10: LoginDivider 컴포넌트 ("또는")

**Files:**

- Create: `src/screens/Onboarding/LoginDivider.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/screens/Onboarding/LoginDivider.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = { theme: Theme; label: string };

export default function LoginDivider({ theme, label }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.line, { backgroundColor: theme.cardBorder }]} />
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <View style={[styles.line, { backgroundColor: theme.cardBorder }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
```

- [ ] **Step 2: 타입체크 + Commit**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

```bash
git add src/screens/Onboarding/LoginDivider.tsx
git commit -m "feat(onboarding): LoginDivider 컴포넌트 추가"
```

---

### Task 11: LoginFeatureCard 단일 카드 컴포넌트

**Files:**

- Create: `src/screens/Onboarding/LoginFeatureCard.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/screens/Onboarding/LoginFeatureCard.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  Icon: React.ComponentType<{ size?: number; color: string }>;
  title: string;
  desc: string;
};

export default function LoginFeatureCard({ theme, Icon, title, desc }: Props) {
  return (
    <View style={styles.col}>
      <View style={[styles.iconWrap, { backgroundColor: theme.accentSoftBg }]}>
        <Icon size={26} color={theme.accent} />
      </View>
      <Text
        style={[styles.title, { color: theme.textPrimary }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={[styles.desc, { color: theme.textSecondary }]}
        numberOfLines={2}
      >
        {desc}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  desc: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
});
```

- [ ] **Step 2: 타입체크 + Commit**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

```bash
git add src/screens/Onboarding/LoginFeatureCard.tsx
git commit -m "feat(onboarding): LoginFeatureCard 단일 카드 컴포넌트 추가"
```

---

### Task 12: LoginFeatureCards 3-카드 레이아웃

**Files:**

- Create: `src/screens/Onboarding/LoginFeatureCards.tsx`

- [ ] **Step 1: 컴포넌트 작성**

```tsx
// src/screens/Onboarding/LoginFeatureCards.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Theme } from "../../theme/theme";

import LoginFeatureCard from "./LoginFeatureCard";
import {
  LockFeatureIcon,
  MapFeatureIcon,
  PhotoFeatureIcon,
} from "./loginFeatureIcons";

type Props = { theme: Theme };

export default function LoginFeatureCards({ theme }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <LoginFeatureCard
        theme={theme}
        Icon={PhotoFeatureIcon}
        title={t("onboarding.login.feature1.title")}
        desc={t("onboarding.login.feature1.desc")}
      />
      <LoginFeatureCard
        theme={theme}
        Icon={MapFeatureIcon}
        title={t("onboarding.login.feature2.title")}
        desc={t("onboarding.login.feature2.desc")}
      />
      <LoginFeatureCard
        theme={theme}
        Icon={LockFeatureIcon}
        title={t("onboarding.login.feature3.title")}
        desc={t("onboarding.login.feature3.desc")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
});
```

- [ ] **Step 2: 타입체크 + Commit**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

```bash
git add src/screens/Onboarding/LoginFeatureCards.tsx
git commit -m "feat(onboarding): 3-카드 가로 배치 컴포넌트 추가"
```

---

### Task 13: LoginStep 재작성 (통합 화면)

**Files:**

- Modify: `src/screens/Onboarding/LoginStep.tsx`

- [ ] **Step 1: 파일 전체 교체**

```tsx
// src/screens/Onboarding/LoginStep.tsx
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import AppleSignInButton from "../../components/auth/AppleSignInButton";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";
import { isAppleSignInAvailable } from "../../features/auth/appleSignIn";
import { useAuthStore } from "../../features/auth/authStore";
import { useTheme } from "../../theme/themeStore";

import LoginDivider from "./LoginDivider";
import LoginFeatureCards from "./LoginFeatureCards";
import LoginHero from "./LoginHero";

type Props = { onNext: () => void };

export default function LoginStep({ onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const user = useAuthStore((s) => s.user);
  const signingIn = useAuthStore((s) => s.signingIn);
  const signInGoogle = useAuthStore((s) => s.signInGoogle);
  const signInApple = useAuthStore((s) => s.signInApple);

  const [appleAvailable, setAppleAvailable] = useState(false);
  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  // user가 채워지면 상위(OnboardingFlow)에서 onNext를 트리거하도록 위임.
  // 재로그인(LoginScreen 대체) 컨텍스트에서는 onNext가 no-op이어도 App.tsx 상위
  // 분기에서 authUser 변화로 메인 UI로 전환된다.
  useEffect(() => {
    if (user) onNext();
  }, [user, onNext]);

  const onPressGoogle = async () => {
    const r = await signInGoogle();
    if (r.ok || r.cancelled) return;
    Alert.alert(t("alerts.loginFailed"), r.message);
  };

  const onPressApple = async () => {
    const r = await signInApple();
    if (r.ok || r.cancelled) return;
    Alert.alert(t("alerts.loginFailed"), r.message);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LoginHero
        theme={theme}
        title={t("onboarding.login.title")}
        subtitle={t("onboarding.login.subtitle")}
      />

      <View style={styles.buttons}>
        <GoogleSignInButton
          label={t("login.googleContinue")}
          onPress={onPressGoogle}
          loading={signingIn}
        />
        {appleAvailable && (
          <AppleSignInButton
            label={t("login.appleContinue")}
            onPress={onPressApple}
            loading={signingIn}
          />
        )}
      </View>

      <View style={styles.divider}>
        <LoginDivider theme={theme} label={t("onboarding.login.dividerOr")} />
      </View>

      <LoginFeatureCards theme={theme} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  buttons: {
    marginTop: 28,
    gap: 12,
  },
  divider: {
    marginTop: 24,
    marginBottom: 20,
  },
});
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

- [ ] **Step 3: Commit**

```bash
git add src/screens/Onboarding/LoginStep.tsx
git commit -m "feat(onboarding): LoginStep을 환영+로그인 통합 화면으로 재작성"
```

---

### Task 14: OnboardingFlow에서 WelcomeStep 제거 + 단계 축소

**Files:**

- Modify: `src/screens/Onboarding/index.tsx`

- [ ] **Step 1: import/상수/렌더링 갱신**

`src/screens/Onboarding/index.tsx`에서 다음 변경:

1. `import WelcomeStep from "./WelcomeStep";` 라인 삭제.
2. `const TOTAL_STEPS = 6;` → `const TOTAL_STEPS = 5;`.
3. step 임계값 effect 갱신:

```tsx
useEffect(() => {
  setStep((prev) => {
    let next = prev;
    if (next < 2 && authUser) next = 2;
    if (next < 3 && homeCountry) next = 3;
    if (next < 4 && profile) next = 4;
    return next;
  });
}, [authUser, homeCountry, profile]);
```

4. step 매핑 갱신:

```tsx
{step === 1 && <LoginStep onNext={() => goTo(2)} />}
{step === 2 && <HomeCountryStep onNext={() => goTo(3)} />}
{step === 3 && <BirthGenderStep onNext={() => goTo(4)} />}
{step === 4 && <SyncStep onNext={() => goTo(5)} />}
{step === 5 && <SuspectTripsStep onFinish={() => void finish()} />}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

- [ ] **Step 3: Commit**

```bash
git add src/screens/Onboarding/index.tsx
git commit -m "refactor(onboarding): WelcomeStep 제거 및 단계 6→5 축소"
```

---

### Task 15: WelcomeStep 파일 삭제

**Files:**

- Delete: `src/screens/Onboarding/WelcomeStep.tsx`

- [ ] **Step 1: 파일 삭제**

Run: `git rm src/screens/Onboarding/WelcomeStep.tsx`

- [ ] **Step 2: 타입체크 — 잔존 참조 없음 확인**

Run: `npx tsc --noEmit`
Expected: 에러 0건. (이미 Task 14에서 import 제거)

Run: `grep -rn "WelcomeStep" src App.tsx`
Expected: 출력 없음(또는 docs/주석 외 코드 참조 없음).

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(onboarding): WelcomeStep 파일 삭제"
```

---

### Task 16: App.tsx — LoginScreen → LoginStep 단독 렌더링

**Files:**

- Modify: `App.tsx`

- [ ] **Step 1: import 교체**

```tsx
// 삭제: import LoginScreen from "./src/screens/LoginScreen";
import LoginStep from "./src/screens/Onboarding/LoginStep";
```

- [ ] **Step 2: 로그아웃 분기 본문 교체**

`!authUser` 분기를 다음으로 교체:

```tsx
if (!authUser) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style={theme.statusBar} />
      {alerts}
      <LoginStep onNext={() => {}} />
    </GestureHandlerRootView>
  );
}
```

기존의 `style={styles.rootDark}`와 `StatusBar style="light"`는 제거 — 이제 라이트 테마 기준의 동일 디자인을 쓰므로 `styles.root`(테마 bg)로 통일한다.

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "refactor(app): 재로그인 분기를 LoginStep 단독 렌더로 통합"
```

---

### Task 17: LoginScreen.tsx 삭제

**Files:**

- Delete: `src/screens/LoginScreen.tsx`

- [ ] **Step 1: 파일 삭제**

Run: `git rm src/screens/LoginScreen.tsx`

- [ ] **Step 2: 잔존 참조 검증**

Run: `grep -rn "LoginScreen" src App.tsx`
Expected: 출력 없음.

Run: `npx tsc --noEmit`
Expected: 에러 0건.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(auth): LoginScreen 파일 삭제 (LoginStep으로 통합 완료)"
```

---

### Task 18: iOS 시뮬레이터 시각 검증

- [ ] **Step 1: iOS 시뮬레이터 실행**

Run: `npx expo run:ios` (이미 빌드돼 있으면 `npx expo start --ios`)

- [ ] **Step 2: 첫 진입 화면 확인 (온보딩)**

기대:
- 진행 바가 1/5 위치(약 20%)에서 표시
- 좌측: TravelDot 타이틀 + 서브타이틀
- 우측: login_image.png hero
- Google 4색 G + chevron이 흰 버튼 가운데 정렬
- Apple 심볼 + chevron이 검정 버튼 가운데 정렬
- "또는" 디바이더가 양쪽 라인과 함께 표시
- 3개 카드(사진/지도/자물쇠 아이콘 + 제목 + 한 줄 설명)가 균등 가로 분할

- [ ] **Step 3: 인터랙션 확인**

기대:
- Google 버튼 탭 → Google 로그인 시트 등장
- Apple 버튼 탭 → Apple 로그인 시트 등장
- 로그인 성공 후 다음 단계(HomeCountry)로 진행

- [ ] **Step 4: 재로그인 흐름 확인**

설정에서 로그아웃 후:
- 동일 LoginStep UI가 진행 바 없이 단독 표시되는지
- 다시 로그인하면 메인 UI로 자연스럽게 전환되는지

---

### Task 19: Android 에뮬레이터 검증

- [ ] **Step 1: 에뮬레이터 실행**

Run: `npx expo run:android`

- [ ] **Step 2: Apple 버튼 hidden 확인**

기대:
- Google 버튼만 표시(Apple 버튼 미렌더 — `appleAvailable=false`).
- 디바이더와 카드는 그대로 표시.
- Google 로그인 정상 동작.

---

### Task 20: 최종 정리 commit (필요 시)

- [ ] **Step 1: lint/typecheck 최종 점검**

Run: `npx tsc --noEmit`
Expected: 에러 0건.

- [ ] **Step 2: 미사용 i18n 키 정리 검토**

`onboarding.welcome.*`는 더 이상 화면에서 참조되지 않는다. 다음 명령으로 확인:

Run: `grep -rn "onboarding.welcome" src/`
Expected: 출력 없음.

미사용으로 확인되면 11개 로케일에서 `onboarding.welcome` 객체를 제거 후 commit.

```bash
git add src/i18n/locales/
git commit -m "chore(i18n): 미사용 onboarding.welcome 키 제거"
```

---

## 종합 검증 체크리스트

- [ ] `npx tsc --noEmit` 통과.
- [ ] iOS 시뮬레이터: 온보딩 진입 시 새 디자인이 참조 이미지와 시각적으로 매칭됨.
- [ ] iOS 시뮬레이터: 로그아웃 후 LoginStep이 진행 바 없이 동일 디자인으로 노출됨.
- [ ] Android 에뮬레이터: Apple 버튼 hidden, Google 버튼 정상 동작.
- [ ] 11개 로케일에서 카드 텍스트 끊김/넘침 없음.
- [ ] `grep -rn "LoginScreen\|WelcomeStep" src App.tsx` 출력 없음.
- [ ] `grep -rn "onboarding.welcome" src/` 출력 없음(Task 20 완료 시).

---

## DRY/YAGNI 체크

- Google/Apple 버튼은 단일 컴포넌트에 캡슐화 → 두 진입점에서 재사용.
- 약관 페이지·외부 hero 이미지 다운로드는 out of scope(추후 별도 spec).
- 카드 4번째(마일스톤) 노출은 원본 마일스톤 기능에 위임 — 신규 키 추가 안 함.
