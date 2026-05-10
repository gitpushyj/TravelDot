import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initI18n } from "./src/i18n";
import { requestTrackingPermissionIfNeeded } from "./src/lib/tracking";
import AppAlerts from "./src/components/AppAlerts";
import { useAuthStore } from "./src/features/auth/authStore";
import { useEntitlementStore } from "./src/features/entitlement/entitlementStore";
import { useHydrateUserProfileFromDb } from "./src/features/onboarding/useHydrateUserProfileFromDb";
import { useOnboardingStore } from "./src/features/onboarding/onboardingStore";
import { useMilestoneStore } from "./src/features/milestone/milestoneStore";
import { useSyncStore } from "./src/features/travelSync/syncStore";
import { useVisitStore } from "./src/features/travel/visitStore";
import { useScreenBottomInset } from "./src/hooks/useScreenInsets";
import { AppCtxProvider, type AppNavCtx } from "./src/navigation/AppCtx";
import RootNavigator from "./src/navigation/RootNavigator";
import type { YearMode } from "./src/navigation/types";
import OnboardingFlow from "./src/screens/Onboarding";
import LoginStep from "./src/screens/Onboarding/LoginStep";
import {
  useSystemSchemeListener,
  useTheme,
  useThemeStore,
} from "./src/theme/themeStore";

// 네이티브 스플래시가 JS 번들 로드 직후 자동으로 사라지면, 아래 hydrate 게이트가
// 모두 통과하기 전에 한 프레임 정도 빈 배경이 노출돼 깜빡임이 보인다. 첫 렌더
// 전에 호출해 두면 우리가 직접 hideAsync 를 부를 때까지 스플래시가 유지된다.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 200, fade: true });

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
  const onboardingLastStep = useOnboardingStore((s) => s.lastStep);
  const milestoneHydrate = useMilestoneStore((s) => s.hydrate);
  const milestoneHydrated = useMilestoneStore((s) => s.hydrated);
  const syncHydrate = useSyncStore((s) => s.hydrate);
  const syncHydrated = useSyncStore((s) => s.hydrated);
  const entitlementHydrate = useEntitlementStore((s) => s.hydrate);
  const entitlementHydrated = useEntitlementStore((s) => s.hydrated);
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  useSystemSchemeListener();
  // 로그인 직후 DB의 사용자 프로필을 로컬 store로 동기화한다.
  // 재설치 후 재로그인 시 본국/생년월일/성별 단계를 자동으로 건너뛰는 핵심 동기화 지점.
  useHydrateUserProfileFromDb();

  const [yearMode, setYearMode] = useState<YearMode>({ kind: "all" });

  useEffect(() => {
    void hydrate();
    void themeHydrate();
    void authHydrate();
    void onboardingHydrate();
    void milestoneHydrate();
    void syncHydrate();
    void entitlementHydrate();
    void initI18n().then(() => setI18nReady(true));
  }, [
    hydrate,
    themeHydrate,
    authHydrate,
    onboardingHydrate,
    milestoneHydrate,
    syncHydrate,
    entitlementHydrate,
  ]);

  // 로그인되어 있고 sync store도 hydrate된 시점에 트립 동기화를 시작한다.
  // push는 모든 tier에서, pull은 premium 이상에서. 결과는 백그라운드라 await하지 않는다.
  useEffect(() => {
    if (!authUser) return;
    if (!syncHydrated) return;
    void useSyncStore.getState().runFullSync();
  }, [authUser, syncHydrated]);

  // user.id 변화 시 entitlement(isAllMilestoneVisible)를 서버 tier로 자동 동기화.
  // 로그아웃 시(user === null)에는 false로 리셋한다. 수동 dev 토글은 이 effect
  // 외에서만 살아 있으므로 override 의도가 살아남는다.
  useEffect(() => {
    if (authUser?.id) {
      void useEntitlementStore.getState().syncFromUserId(authUser.id);
    } else {
      void useEntitlementStore.getState().setAllMilestoneVisible(false);
    }
  }, [authUser?.id]);

  // iOS App Tracking Transparency 프롬프트. 첫 렌더 직전(hydrate 완료) 1회만
  // 호출한다. Android에서는 no-op.
  useEffect(() => {
    if (!i18nReady) return;
    void requestTrackingPermissionIfNeeded();
  }, [i18nReady]);

  useEffect(() => {
    if (yearMode.kind === "year") {
      void ensureYearCounts(yearMode.year);
    }
  }, [yearMode, ensureYearCounts]);

  // 기존 사용자(이미 로그인 + 본국 설정 완료)는 자동으로 온보딩 완료 처리.
  // hydrate 직후 한 번만 평가해야 한다. 그렇지 않으면 신규 사용자가 온보딩
  // step 3에서 본국을 선택하는 순간 homeCountry 변화로 effect가 재발동해
  // 남은 step 4·5를 건너뛰고 바로 메인으로 빠진다.
  // 신규 사용자가 새 onboarding을 거치는 도중 앱을 강제 종료한 경우(lastStep > 0)에는
  // 사진 sync 단계로 다시 돌아갈 수 있어야 하므로 여기서 markCompleted를 부르지 않는다.
  const autoCompleteEvaluatedRef = useRef(false);
  useEffect(() => {
    if (autoCompleteEvaluatedRef.current) return;
    if (!ready || !authHydrated || !onboardingHydrated) return;
    autoCompleteEvaluatedRef.current = true;
    if (onboardingCompleted) return;
    if (onboardingLastStep > 0) return;
    if (authUser && homeCountry) {
      void onboardingMarkCompleted();
    }
  }, [
    ready,
    authHydrated,
    onboardingHydrated,
    onboardingCompleted,
    onboardingLastStep,
    authUser,
    homeCountry,
    onboardingMarkCompleted,
  ]);

  const activeCounts = useMemo(() => {
    if (yearMode.kind === "year") {
      return visitCountsByYear[yearMode.year] ?? {};
    }
    return visitCounts;
  }, [yearMode, visitCounts, visitCountsByYear]);

  const appReady =
    ready &&
    themeHydrated &&
    authHydrated &&
    onboardingHydrated &&
    milestoneHydrated &&
    entitlementHydrated &&
    i18nReady;

  // 모든 store hydrate + i18n 초기화가 끝나면 네이티브 스플래시를 내린다.
  // useEffect 는 commit 이후 발화하므로 다음 프레임에는 이미 실 UI 가
  // 마운트돼 있어 스플래시 → 본 화면 전환 중 빈 배경 노출이 없다.
  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  if (!appReady) {
    return <View style={styles.root} />;
  }

  // AppAlerts 는 useTranslation 을 사용하므로 i18n 초기화가 끝난 분기에서만
  // 마운트한다. pendingInitialScan=true 일 때(온보딩 중) OnboardingFlow 가
  // 자체 안내 UI 로 결과를 보여주므로 토스트 중복 노출을 막는다.
  const alerts = <AppAlerts pendingInitialScan={!onboardingCompleted} />;

  // 온보딩 미완료 → OnboardingFlow가 모든 단계를 책임진다.
  if (!onboardingCompleted) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <StatusBar style={theme.statusBar} />
          {alerts}
          <OnboardingFlow />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // 온보딩 완료 후 어떤 이유로든 로그아웃된 경우 LoginStep만 단독 노출.
  // OnboardingFlow를 거치지 않으므로 진행 바는 표시되지 않는다. 로그인 성공 후
  // authUser가 채워지면 다음 렌더에서 메인 UI 분기로 자동 전환된다.
  if (!authUser) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <StatusBar style={theme.statusBar} />
          {alerts}
          <LoginStandaloneContainer rootStyle={styles.root}>
            <LoginStep onNext={() => {}} />
          </LoginStandaloneContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  const ctxValue: AppNavCtx = { yearMode, setYearMode, activeCounts };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppCtxProvider value={ctxValue}>
          {alerts}
          <RootNavigator />
        </AppCtxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function makeStyles(theme: { homeBg: string }) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.homeBg },
  });
}

// LoginStep 단독 사용 시 Android navigation bar 영역을 회피하기 위한 wrapper.
// SafeAreaProvider 안쪽에서 useSafeAreaInsets 를 호출하기 위해 분리해 둔다.
function LoginStandaloneContainer({
  rootStyle,
  children,
}: {
  rootStyle: { flex: number; backgroundColor: string };
  children: React.ReactNode;
}) {
  const bottomInset = useScreenBottomInset();
  return <View style={[rootStyle, { paddingBottom: bottomInset }]}>{children}</View>;
}
