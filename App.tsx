import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initI18n } from "./src/i18n";
import AppAlerts from "./src/components/AppAlerts";
import { useAuthStore } from "./src/features/auth/authStore";
import { useOnboardingStore } from "./src/features/onboarding/onboardingStore";
import { useMilestoneStore } from "./src/features/milestone/milestoneStore";
import { useVisitStore } from "./src/features/travel/visitStore";
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
  const milestoneHydrate = useMilestoneStore((s) => s.hydrate);
  const milestoneHydrated = useMilestoneStore((s) => s.hydrated);
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  useSystemSchemeListener();

  const [yearMode, setYearMode] = useState<YearMode>({ kind: "all" });

  useEffect(() => {
    void hydrate();
    void themeHydrate();
    void authHydrate();
    void onboardingHydrate();
    void milestoneHydrate();
    void initI18n().then(() => setI18nReady(true));
  }, [hydrate, themeHydrate, authHydrate, onboardingHydrate, milestoneHydrate]);

  useEffect(() => {
    if (yearMode.kind === "year") {
      void ensureYearCounts(yearMode.year);
    }
  }, [yearMode, ensureYearCounts]);

  // 기존 사용자(이미 로그인 + 본국 설정 완료)는 자동으로 온보딩 완료 처리.
  // hydrate 직후 한 번만 평가해야 한다. 그렇지 않으면 신규 사용자가 온보딩
  // step 3에서 본국을 선택하는 순간 homeCountry 변화로 effect가 재발동해
  // 남은 step 4·5를 건너뛰고 바로 메인으로 빠진다.
  const autoCompleteEvaluatedRef = useRef(false);
  useEffect(() => {
    if (autoCompleteEvaluatedRef.current) return;
    if (!ready || !authHydrated || !onboardingHydrated) return;
    autoCompleteEvaluatedRef.current = true;
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
    !milestoneHydrated ||
    !i18nReady
  ) {
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
        <StatusBar style={theme.statusBar} />
        {alerts}
        <OnboardingFlow />
      </GestureHandlerRootView>
    );
  }

  // 온보딩 완료 후 어떤 이유로든 로그아웃된 경우 LoginScreen만 노출.
  if (!authUser) {
    return (
      <GestureHandlerRootView style={styles.rootDark}>
        <StatusBar style="light" />
        {alerts}
        <LoginScreen />
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
    rootDark: { flex: 1 },
  });
}
