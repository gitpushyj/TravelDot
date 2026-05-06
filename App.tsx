import { StatusBar } from "expo-status-bar";
import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import CountryShape from "./src/components/CountryShape";
import DotMap from "./src/components/DotMap";
import YearPickerModal from "./src/components/YearPickerModal";
import type { RecentTrip } from "./src/features/travel/visitRepository";
import {
  getTierByCount,
  TIER_CUTOFFS,
} from "./src/features/travel/tierTitles";
import { useAuthStore } from "./src/features/auth/authStore";
import { useVisitStore } from "./src/features/travel/visitStore";
import { pickActiveBadge, useBadgeStore } from "./src/features/badges/badgeStore";
import { COUNTRY_NAME_KO_BY_CODE as BADGE_KO_NAMES } from "./src/features/badges/countryNames";
import AddTripScreen from "./src/screens/AddTripScreen";
import CountryDetailScreen from "./src/screens/CountryDetailScreen";
import EditTripScreen from "./src/screens/EditTripScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import InitialScanScreen from "./src/screens/InitialScanScreen";
import LoginScreen from "./src/screens/LoginScreen";
import MapZoomScreen from "./src/screens/MapZoomScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import ReviewSuspectTripsScreen from "./src/screens/ReviewSuspectTripsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import TitlesScreen from "./src/screens/TitlesScreen";
import TripDetailScreen from "./src/screens/TripDetailScreen";
import countriesJson from "./assets/data/countries.json";
import { flagEmoji } from "./src/utils/flag";
import { colorForCountry, readableTextOn } from "./src/utils/countryColors";
import { type Theme } from "./src/theme/theme";
import {
  useSystemSchemeListener,
  useTheme,
  useThemeStore,
} from "./src/theme/themeStore";

// UN 가입국 193개 기준 (NomadMania UN Master와 정렬)
const TOTAL_COUNTRIES = 193;

type CountryEntry = { code: string; name: string; nameKo: string };
const COUNTRY_LIST = countriesJson as CountryEntry[];
const KO_NAME_BY_CODE: Record<string, string> = {};
for (const c of COUNTRY_LIST) KO_NAME_BY_CODE[c.code] = c.nameKo;

type YearMode = { kind: "all" } | { kind: "year"; year: number };

type RootStackParamList = {
  Main: undefined;
  AddTrip: undefined;
  Settings: undefined;
  ChangeHome: undefined;
  Titles: undefined;
  MapZoom: undefined;
  CountryDetail: undefined;
  TripDetail: { trip: RecentTrip };
  EditTrip: { trip: RecentTrip };
  History: undefined;
  ReviewSuspect: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// 스캔 완료 알림에서 Stack.Navigator 안의 화면으로 이동시키기 위한 navigation ref.
// 알림 effect는 NavigationContainer 바깥(App 컴포넌트)에 있어 hooks로 navigation을
// 받을 수 없어서 ref로 우회한다.
const navigationRef = createNavigationContainerRef<RootStackParamList>();

type AppNavCtx = {
  yearMode: YearMode;
  setYearMode: (m: YearMode) => void;
  activeCounts: Record<string, number>;
};
const AppCtx = createContext<AppNavCtx | null>(null);
const useAppCtx = () => {
  const v = useContext(AppCtx);
  if (!v) throw new Error("AppCtx not provided");
  return v;
};

export default function App() {
  const ready = useVisitStore((s) => s.ready);
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const hydrate = useVisitStore((s) => s.hydrate);
  const syncStatus = useVisitStore((s) => s.syncStatus);
  const visitCounts = useVisitStore((s) => s.visitCounts);
  const visitCountsByYear = useVisitStore((s) => s.visitCountsByYear);
  const ensureYearCounts = useVisitStore((s) => s.ensureYearCounts);
  const lastSync = useVisitStore((s) => s.lastSync);
  const setLastSync = useVisitStore((s) => s.setLastSync);
  const homeCleanupReport = useVisitStore((s) => s.homeCleanupReport);
  const setHomeCleanupReport = useVisitStore((s) => s.setHomeCleanupReport);
  const suspectTrips = useVisitStore((s) => s.suspectTrips);
  const themeHydrate = useThemeStore((s) => s.hydrate);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const authHydrate = useAuthStore((s) => s.hydrate);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const authUser = useAuthStore((s) => s.user);
  const pendingNotifications = useBadgeStore((s) => s.pendingNotifications);
  const consumeBadgeNotifications = useBadgeStore((s) => s.consumeNotifications);
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
  }, [hydrate, themeHydrate, authHydrate]);

  useEffect(() => {
    if (yearMode.kind === "year") {
      void ensureYearCounts(yearMode.year);
    }
  }, [yearMode, ensureYearCounts]);

  useEffect(() => {
    if (!lastSync) return;
    if (syncStatus.running) return;
    // 초기 스캔 화면은 결과를 자체 UI로 직접 보여주므로 알림을 띄우지 않는다.
    if (pendingInitialScan) return;
    const { permission, scanned, added, error } = lastSync;

    let title = "사진 확인이 끝났어요";
    let body: string;

    if (error) {
      title = "사진을 확인하지 못했어요";
      body =
        "사진을 불러오는 도중 문제가 생겼어요.\n잠시 후 설정에서 다시 스캔해 주세요.";
    } else if (permission === "denied") {
      title = "사진 접근 권한이 필요해요";
      body =
        "여행 기록을 찾으려면 사진 접근 권한이 필요해요.\n설정에서 사진 권한을 허용해 주세요.";
    } else if (added > 0) {
      body = `사진 ${scanned.toLocaleString()}장을 살펴보고\n여행 기록에 ${added.toLocaleString()}장을 새로 추가했어요.`;
      if (permission === "limited") {
        body +=
          "\n\n현재 일부 사진에만 접근할 수 있어요.\n전체 사진을 허용하면 더 많은 여행을 찾아드릴 수 있어요.";
      }
    } else if (scanned > 0) {
      body =
        "이미 모든 사진을 확인했어요.\n새로 추가된 여행 기록은 없어요.";
      if (permission === "limited") {
        body +=
          "\n\n전체 사진 접근을 허용하면\n놓친 여행을 더 찾아드릴 수 있어요.";
      }
    } else {
      body =
        permission === "limited"
          ? "확인할 수 있는 사진이 없어요.\n전체 사진 접근을 허용해 주세요."
          : "확인할 사진이 없어요.";
    }

    const suspectCount = suspectTrips.length;
    if (!error && permission !== "denied" && suspectCount > 0) {
      body +=
        `\n\n다른 기기로 찍힌 사진만 있는 여행 ${suspectCount}개를 찾았어요.\n` +
        `친구한테 받은 사진이라면 기록에서 빼주세요.`;
    }

    const buttons: {
      text: string;
      style?: "default" | "cancel" | "destructive";
      onPress: () => void;
    }[] = [{ text: "확인", onPress: () => setLastSync(null) }];
    if (!error && permission !== "denied" && suspectCount > 0) {
      buttons.unshift({
        text: "확인하러 가기",
        onPress: () => {
          setLastSync(null);
          if (navigationRef.isReady()) {
            navigationRef.navigate("ReviewSuspect");
          }
        },
      });
    }

    Alert.alert(title, body, buttons);
  }, [lastSync, syncStatus.running, setLastSync, suspectTrips, pendingInitialScan]);

  useEffect(() => {
    if (!homeCleanupReport) return;
    const koName =
      KO_NAME_BY_CODE[homeCleanupReport.countryCode] ??
      homeCleanupReport.countryCode;
    Alert.alert(
      "본국 자동 기록 정리",
      `본국(${koName})은 이제 자동 추가에서 제외됩니다.\n` +
        `이미 자동으로 들어가 있던 ${homeCleanupReport.daysDeleted}일 / 사진 ${homeCleanupReport.photosDeleted}장을 정리했어요.\n\n` +
        `본국에서 찍은 사진은 메뉴 > "여행 추가"에서 원하는 날짜만 직접 선택해 추가할 수 있습니다.`,
      [{ text: "확인", onPress: () => setHomeCleanupReport(null) }]
    );
  }, [homeCleanupReport, setHomeCleanupReport]);

  // 새로 잠금 해제된 뱃지가 여러 개여도 한 번의 알림으로 묶어서 표시한다.
  // 스캔 한 번에 호칭이 여러 개 풀릴 수 있어 팝업이 연달아 뜨는 것을 막기 위함.
  useEffect(() => {
    const count = pendingNotifications.length;
    if (count === 0) return;
    const batch = pendingNotifications.slice(0, count);
    const title =
      count === 1
        ? "새로운 뱃지를 얻었어요!"
        : `새로운 뱃지 ${count}개를 얻었어요!`;
    const body =
      count === 1
        ? `${batch[0].emoji}  ${batch[0].titleKo}\n\n${batch[0].description}\n\n설정 > 호칭에서 골라 홈 화면에 표시할 수 있어요.`
        : `${batch
            .map((b) => `${b.emoji}  ${b.titleKo}`)
            .join("\n")}\n\n설정 > 호칭에서 골라 홈 화면에 표시할 수 있어요.`;
    Alert.alert(title, body, [
      { text: "확인", onPress: () => consumeBadgeNotifications(count) },
    ]);
  }, [pendingNotifications, consumeBadgeNotifications]);

  const activeCounts = useMemo(() => {
    if (yearMode.kind === "year") {
      return visitCountsByYear[yearMode.year] ?? {};
    }
    return visitCounts;
  }, [yearMode, visitCounts, visitCountsByYear]);

  if (!ready || !themeHydrated || !authHydrated) {
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
        <AppCtx.Provider value={ctxValue}>
          <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.homeBg },
              }}
            >
              <Stack.Screen name="Main" component={MainScreen} />
              <Stack.Screen name="AddTrip" component={AddTripScreenNav} />
              <Stack.Screen name="Settings" component={SettingsScreenNav} />
              <Stack.Screen name="ChangeHome" component={ChangeHomeScreenNav} />
              <Stack.Screen name="Titles" component={TitlesScreenNav} />
              <Stack.Screen name="MapZoom" component={MapZoomScreenNav} />
              <Stack.Screen
                name="CountryDetail"
                component={CountryDetailScreenNav}
              />
              <Stack.Screen
                name="TripDetail"
                component={TripDetailScreenNav}
              />
              <Stack.Screen name="EditTrip" component={EditTripScreenNav} />
              <Stack.Screen name="History" component={HistoryScreenNav} />
              <Stack.Screen
                name="ReviewSuspect"
                component={ReviewSuspectScreenNav}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AppCtx.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function MainScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Main">) {
  const { yearMode, setYearMode, activeCounts } = useAppCtx();
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const recentTrips = useVisitStore((s) => s.recentTrips);
  const availableYears = useVisitStore((s) => s.availableYears);
  const syncStatus = useVisitStore((s) => s.syncStatus);
  const activeBadgeId = useBadgeStore((s) => s.activeId);
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [mapInteracting, setMapInteracting] = useState(false);

  const totals = useMemo(() => {
    const codes = Object.keys(activeCounts);
    let days = 0;
    for (const c of codes) days += activeCounts[c] ?? 0;
    return { countries: codes.length, days };
  }, [activeCounts]);

  const milestone = useMemo(() => {
    const visited = totals.countries;
    const next = TIER_CUTOFFS.find((m) => m > visited) ?? TOTAL_COUNTRIES;
    return { next, remaining: Math.max(0, next - visited) };
  }, [totals.countries]);

  const tier = useMemo(
    () => getTierByCount(totals.countries),
    [totals.countries]
  );

  // 활성 뱃지: 사용자 선택이 있으면 그것, 없으면 현재 등급 뱃지
  const activeBadge = useMemo(
    () => pickActiveBadge(activeBadgeId, `tier_${tier.id}`, BADGE_KO_NAMES),
    [activeBadgeId, tier.id]
  );

  const periodLabel = useMemo(() => {
    if (yearMode.kind === "year") return String(yearMode.year);
    if (availableYears.length === 0) return String(new Date().getFullYear());
    const max = Math.max(...availableYears);
    const min = Math.min(...availableYears);
    return min === max ? String(max) : `${min}–${max}`;
  }, [yearMode, availableYears]);

  const openYearPicker = () => {
    if (availableYears.length === 0) {
      Alert.alert("연도 선택", "아직 기록된 여행이 없습니다.");
      return;
    }
    setYearPickerOpen(true);
  };

  const percent =
    Math.round((totals.countries / TOTAL_COUNTRIES) * 1000) / 10;

  if (!homeCountry) return null;

  return (
    <View style={styles.root}>
      <StatusBar style={theme.statusBar} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!mapInteracting}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.periodLabel}>{periodLabel}</Text>
            <View style={styles.headerStatRow}>
              <Text style={styles.headerStatNum}>{totals.countries}</Text>
              <Text style={styles.headerStatUnit}> 개국</Text>
              <Text style={styles.headerStatDot}> · </Text>
              <Text style={styles.headerStatNum}>{totals.days}</Text>
              <Text style={styles.headerStatUnit}> 일</Text>
            </View>
          </View>
          <Pressable
            onPress={() => navigation.navigate("Settings")}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              styles.iconBtnLarge,
              pressed && styles.iconBtnPressed,
            ]}
          >
            <Text style={[styles.iconBtnText, styles.iconBtnTextLarge]}>⚙︎</Text>
          </Pressable>
        </View>

        <View style={styles.tabRow}>
          <View style={styles.tabPills}>
            <Pressable
              onPress={() => setYearMode({ kind: "all" })}
              style={[
                styles.tab,
                yearMode.kind === "all" && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  yearMode.kind === "all" && styles.tabTextActive,
                ]}
              >
                전체
              </Text>
            </Pressable>
            <Pressable
              onPress={openYearPicker}
              style={[
                styles.tab,
                yearMode.kind === "year" && styles.tabActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  yearMode.kind === "year" && styles.tabTextActive,
                ]}
              >
                {yearMode.kind === "year" ? `${yearMode.year} ▾` : "연도 ▾"}
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => navigation.navigate("MapZoom")}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
          >
            <Text style={styles.iconBtnText}>⛶</Text>
          </Pressable>
        </View>

        {syncStatus.running && (
          <View style={styles.syncBar}>
            <Text style={styles.syncText}>
              사진 스캔 중 · {syncStatus.processed}장 처리됨
            </Text>
          </View>
        )}

        <View style={styles.mapWrap}>
          <DotMap
            visitCounts={activeCounts}
            onInteractingChange={setMapInteracting}
          />
        </View>

        <View style={styles.statsRow}>
          <MiniCard
            theme={theme}
            homeCode={homeCountry.code}
            visitCounts={activeCounts}
            onPress={() => navigation.navigate("CountryDetail")}
          />
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <Text style={styles.statTitle}>방문 국가</Text>
              <Text
                style={[
                  styles.statTier,
                  // 활성 뱃지가 등급 뱃지가 아니면(=사용자가 직접 고른 테마 뱃지면) 강조
                  activeBadge && !activeBadge.isTier
                    ? styles.statTierPrestige
                    : tier.prestige
                      ? styles.statTierPrestige
                      : null,
                ]}
                numberOfLines={1}
              >
                {activeBadge
                  ? `${activeBadge.emoji} ${activeBadge.titleKo}`
                  : tier.titleKo}
              </Text>
            </View>
            <View style={styles.statBigRow}>
              <Text style={styles.statBigNum}>{totals.countries}</Text>
              <Text style={styles.statBigDenom}> / {TOTAL_COUNTRIES}</Text>
              <Text style={styles.statBigPercent}>  {percent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      (totals.countries / TOTAL_COUNTRIES) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.statFooter}>
              <Text style={styles.statFooterLabel}>
                다음 마일스톤{" "}
                <Text style={styles.statFooterStrong}>
                  {milestone.next}개국
                </Text>
              </Text>
              <Text style={styles.statFooterAccent}>
                {milestone.remaining} 남음
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>최근 방문</Text>
          <Pressable
            onPress={() => navigation.navigate("History")}
            hitSlop={8}
          >
            <Text style={styles.allLink}>전체보기 →</Text>
          </Pressable>
        </View>
        <RecentList
          theme={theme}
          trips={recentTrips}
          onSelect={(t) => navigation.navigate("TripDetail", { trip: t })}
        />
      </ScrollView>
      <YearPickerModal
        visible={yearPickerOpen}
        initial={yearMode}
        onCancel={() => setYearPickerOpen(false)}
        onApply={(mode) => {
          setYearMode(mode);
          setYearPickerOpen(false);
        }}
      />
    </View>
  );
}

function AddTripScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "AddTrip">) {
  return (
    <>
      <StatusBar style="light" />
      <AddTripScreen onClose={() => navigation.goBack()} />
    </>
  );
}

function SettingsScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Settings">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <SettingsScreen
        onClose={() => navigation.goBack()}
        onAddTrip={() => navigation.navigate("AddTrip")}
        onOpenTitles={() => navigation.navigate("Titles")}
        onChangeHome={() => navigation.navigate("ChangeHome")}
        onReviewSuspect={() => navigation.navigate("ReviewSuspect")}
      />
    </>
  );
}

function ReviewSuspectScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ReviewSuspect">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <ReviewSuspectTripsScreen onClose={() => navigation.goBack()} />
    </>
  );
}

function ChangeHomeScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ChangeHome">) {
  return (
    <>
      <StatusBar style="light" />
      <OnboardingScreen mode="change" onClose={() => navigation.goBack()} />
    </>
  );
}

function TitlesScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Titles">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <TitlesScreen onClose={() => navigation.goBack()} />
    </>
  );
}

function MapZoomScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "MapZoom">) {
  const { activeCounts } = useAppCtx();
  return (
    <MapZoomScreen
      visitCounts={activeCounts}
      onClose={() => navigation.goBack()}
    />
  );
}

function CountryDetailScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "CountryDetail">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <CountryDetailScreen
        onClose={() => navigation.goBack()}
        onSelectTrip={(trip) => navigation.navigate("TripDetail", { trip })}
      />
    </>
  );
}

function TripDetailScreenNav({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "TripDetail">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <TripDetailScreen
        trip={route.params.trip}
        onClose={() => navigation.goBack()}
        onEdit={() => navigation.navigate("EditTrip", { trip: route.params.trip })}
      />
    </>
  );
}

function EditTripScreenNav({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "EditTrip">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <EditTripScreen
        trip={route.params.trip}
        // 저장/취소 모두 detail 화면으로 돌아간다. 저장 후엔 visit store가
        // refreshVisits로 갱신되어 detail 화면이 자동으로 재진입 시 새 데이터를 본다.
        // 다만 detail 화면이 이미 mount된 상태에서 trip params는 그대로이므로,
        // 날짜가 바뀌었으면 detail이 보여주는 trip이 더 이상 존재하지 않을 수 있다.
        // 이 경우 두 단계 뒤로 돌아가 trip 목록으로 보낸다.
        onClose={(changed) => {
          if (changed) {
            navigation.pop(2);
          } else {
            navigation.goBack();
          }
        }}
      />
    </>
  );
}

function HistoryScreenNav({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "History">) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.statusBar} />
      <HistoryScreen
        onClose={() => navigation.goBack()}
        onSelectTrip={(trip) => navigation.navigate("TripDetail", { trip })}
      />
    </>
  );
}

function MiniCard({
  theme,
  homeCode,
  visitCounts,
  onPress,
}: {
  theme: Theme;
  homeCode: string;
  visitCounts: Record<string, number>;
  onPress: () => void;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const selectedCountry = useVisitStore((s) => s.selectedCountry);
  const code = selectedCountry?.code ?? homeCode;
  const name = selectedCountry?.name ?? "";
  const isHome = code === homeCode;
  const visitDays = visitCounts[code] ?? 0;
  const countryColor = colorForCountry(code);
  const textColor = readableTextOn(countryColor.bg);

  return (
    <Pressable
      onPress={onPress}
      pointerEvents="box-only"
      style={({ pressed }) => [
        styles.miniCard,
        { backgroundColor: countryColor.bg, borderColor: countryColor.bg },
        pressed && { opacity: 0.85 },
      ]}
    >
      {isHome && (
        <View style={styles.miniBadge}>
          <Text style={styles.miniBadgeText}>본국</Text>
        </View>
      )}
      <View style={styles.miniDotsArea}>
        <CountryShape countryCode={code} color={countryColor.dot} />
      </View>
      <Text style={[styles.miniTitle, { color: textColor }]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.miniSub, { color: textColor, opacity: 0.85 }]}>
        {isHome ? "본국" : `${visitDays}일 방문`}
      </Text>
    </Pressable>
  );
}

function RecentList({
  theme,
  trips,
  onSelect,
}: {
  theme: Theme;
  trips: RecentTrip[];
  onSelect: (trip: RecentTrip) => void;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  if (trips.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>
          아직 기록된 여행이 없어요. 사진을 스캔하거나 직접 추가해보세요.
        </Text>
      </View>
    );
  }
  const display = trips.slice(0, 5);
  return (
    <FlatList
      data={display}
      keyExtractor={(t) => `${t.countryCode}-${t.startDate}`}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.rowSep} />}
      renderItem={({ item, index }) => {
        const koName = KO_NAME_BY_CODE[item.countryCode] ?? item.countryCode;
        const [y, m, d] = item.startDate.split("-");
        return (
          <Pressable
            onPress={() => onSelect(item)}
            style={({ pressed }) => [
              styles.recentRow,
              pressed && { backgroundColor: theme.rowPressedBg },
            ]}
          >
            <View style={styles.flagBox}>
              <Text style={styles.flagText}>{flagEmoji(item.countryCode)}</Text>
            </View>
            <View style={styles.recentMain}>
              <View style={styles.recentTitleRow}>
                <Text style={styles.recentName}>{koName}</Text>
                <Text style={styles.recentCode}> {item.countryCode}</Text>
                {index === 0 && (
                  <View style={styles.recentBadge}>
                    <Text style={styles.recentBadgeText}>최근</Text>
                  </View>
                )}
              </View>
              <Text style={styles.recentDate}>
                {y} · {m} · {d} · {item.days}일 여행
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        );
      }}
    />
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
    },
    rootDark: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 56,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    headerLeft: { flex: 1 },
    periodLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    headerStatRow: {
      flexDirection: "row",
      alignItems: "baseline",
      marginTop: 2,
    },
    headerStatNum: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: "800",
    },
    headerStatUnit: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    headerStatDot: {
      color: theme.textMuted,
      fontSize: 18,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    iconBtnPressed: { backgroundColor: theme.tabRowBg },
    iconBtnLarge: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    iconBtnText: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    iconBtnTextLarge: {
      fontSize: 22,
    },
    tabRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 8,
      gap: 12,
    },
    tabPills: {
      flexDirection: "row",
      backgroundColor: theme.tabRowBg,
      borderRadius: 999,
      padding: 4,
      gap: 4,
    },
    tab: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
    },
    tabActive: {
      backgroundColor: theme.cardBg,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 1,
    },
    tabText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    tabTextActive: {
      color: theme.textPrimary,
      fontWeight: "700",
    },
    syncBar: {
      marginHorizontal: 20,
      marginTop: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: theme.cardBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    syncText: { color: theme.accentSoftText, fontSize: 12, fontWeight: "600" },
    mapWrap: {
      marginTop: 8,
      marginBottom: 16,
      paddingHorizontal: 0,
      paddingVertical: 12,
      backgroundColor: theme.cardBg,
      position: "relative",
    },
    statsRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 24,
    },
    miniCard: {
      flex: 1,
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 12,
      minHeight: 140,
    },
    miniCardPressed: {
      backgroundColor: theme.tabRowBg,
    },
    miniBadge: {
      alignSelf: "flex-start",
      backgroundColor: theme.tabRowBg,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    miniBadgeText: {
      color: theme.textPrimary,
      fontSize: 11,
      fontWeight: "700",
    },
    miniDotsArea: {
      flex: 1,
      alignItems: "stretch",
      justifyContent: "center",
      paddingVertical: 8,
    },
    miniTitle: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    miniSub: {
      color: theme.textSecondary,
      fontSize: 11,
      marginTop: 2,
    },
    statCard: {
      flex: 1.5,
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 14,
      minHeight: 140,
      justifyContent: "space-between",
    },
    statHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    statTitle: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    statTier: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "700",
      maxWidth: 180,
      flexShrink: 1,
    },
    statTierPrestige: {
      color: theme.accentSoftText,
      backgroundColor: theme.accentSoftBg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      overflow: "hidden",
    },
    statBigRow: {
      flexDirection: "row",
      alignItems: "baseline",
      marginTop: 4,
    },
    statBigNum: {
      color: theme.textPrimary,
      fontSize: 30,
      fontWeight: "800",
    },
    statBigDenom: {
      color: theme.textMuted,
      fontSize: 14,
      fontWeight: "600",
    },
    statBigPercent: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: "700",
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.tabRowBg,
      overflow: "hidden",
      marginTop: 8,
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
      backgroundColor: theme.accent,
    },
    statFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
    },
    statFooterLabel: {
      color: theme.textSecondary,
      fontSize: 11,
    },
    statFooterStrong: {
      color: theme.textPrimary,
      fontWeight: "700",
    },
    statFooterAccent: {
      color: theme.accent,
      fontSize: 11,
      fontWeight: "700",
    },
    recentHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    allLink: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: "700",
    },
    rowSep: { height: 1, backgroundColor: theme.cardBorder, marginLeft: 20 },
    recentRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
    },
    flagBox: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: theme.flagBoxBg,
      alignItems: "center",
      justifyContent: "center",
    },
    flagText: { fontSize: 26 },
    recentMain: { flex: 1 },
    recentTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    recentName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    recentCode: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    recentBadge: {
      marginLeft: 6,
      backgroundColor: theme.accentSoftBg,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    recentBadgeText: {
      color: theme.accentSoftText,
      fontSize: 10,
      fontWeight: "800",
    },
    recentDate: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    chev: {
      color: theme.textMuted,
      fontSize: 22,
      fontWeight: "400",
    },
    emptyWrap: {
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 13,
      textAlign: "center",
    },
  });
}
