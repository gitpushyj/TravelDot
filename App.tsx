import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { initI18n } from "./src/i18n";
import { useAuthStore } from "./src/features/auth/authStore";
import { useVisitStore } from "./src/features/travel/visitStore";
import { useBadgeNotificationAlert } from "./src/hooks/useBadgeNotificationAlert";
import { useHomeCleanupAlert } from "./src/hooks/useHomeCleanupAlert";
import { useScanCompletionAlert } from "./src/hooks/useScanCompletionAlert";
import { AppCtxProvider, type AppNavCtx } from "./src/navigation/AppCtx";
import RootNavigator from "./src/navigation/RootNavigator";
import type { YearMode } from "./src/navigation/types";
import InitialScanScreen from "./src/screens/InitialScanScreen";
import LoginScreen from "./src/screens/LoginScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
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
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  useSystemSchemeListener();

  // 첫 본국 선택 직후 InitialScanScreen으로 진입해 권한 요청 + 스캔 + 의심 여행
  // 리스트를 한 화면에서 보여준다. homeCountry가 store에 반영되기 전에 켜져
  // 있을 수 있어 NavigationContainer 위에서 우선 분기시킨다.
  const [pendingInitialScan, setPendingInitialScan] = useState(false);
  const [yearMode, setYearMode] = useState<YearMode>({ kind: "all" });

  useEffect(() => {
    void hydrate();
    void themeHydrate();
    void authHydrate();
    void initI18n().then(() => setI18nReady(true));
  }, [hydrate, themeHydrate, authHydrate]);

  useEffect(() => {
    if (yearMode.kind === "year") {
      void ensureYearCounts(yearMode.year);
    }
  }, [yearMode, ensureYearCounts]);

  useScanCompletionAlert(pendingInitialScan);
  useHomeCleanupAlert();
  useBadgeNotificationAlert();

  const activeCounts = useMemo(() => {
    if (yearMode.kind === "year") {
      return visitCountsByYear[yearMode.year] ?? {};
    }
    return visitCounts;
  }, [yearMode, visitCounts, visitCountsByYear]);

  if (!ready || !themeHydrated || !authHydrated || !i18nReady) {
    return <View style={styles.root} />;
  }

  // 로그인은 필수. 미로그인 상태면 다른 모든 화면보다 먼저 차단한다.
  if (!authUser) {
    return (
      <GestureHandlerRootView style={styles.rootDark}>
        <StatusBar style="light" />
        <LoginScreen />
      </GestureHandlerRootView>
    );
  }

  // 초기 스캔은 homeCountry가 store에 반영되기 직전에 들어올 수 있으므로
  // !homeCountry 체크보다 먼저 분기시켜 화면 깜빡임을 막는다.
  if (pendingInitialScan) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style={theme.statusBar} />
        <InitialScanScreen onDone={() => setPendingInitialScan(false)} />
      </GestureHandlerRootView>
    );
  }

  if (!homeCountry) {
    return (
      <GestureHandlerRootView style={styles.rootDark}>
        <StatusBar style="light" />
        <OnboardingScreen onAfterSetup={() => setPendingInitialScan(true)} />
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
