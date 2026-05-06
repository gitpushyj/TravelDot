import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
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

import CountryShape from "./src/components/CountryShape";
import DotMap from "./src/components/DotMap";
import YearPickerModal from "./src/components/YearPickerModal";
import type { RecentTrip } from "./src/features/travel/visitRepository";
import {
  getTierByCount,
  TIER_CUTOFFS,
} from "./src/features/travel/tierTitles";
import { useVisitStore } from "./src/features/travel/visitStore";
import { pickActiveBadge, useBadgeStore } from "./src/features/badges/badgeStore";
import { COUNTRY_NAME_KO_BY_CODE as BADGE_KO_NAMES } from "./src/features/badges/countryNames";
import AddTripScreen from "./src/screens/AddTripScreen";
import MapZoomScreen from "./src/screens/MapZoomScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import TitlesScreen from "./src/screens/TitlesScreen";
import countriesJson from "./assets/data/countries.json";
import { flagEmoji } from "./src/utils/flag";
import { colorForVisitWith, type Theme } from "./src/theme/theme";
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

export default function App() {
  const ready = useVisitStore((s) => s.ready);
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const hydrate = useVisitStore((s) => s.hydrate);
  const syncStatus = useVisitStore((s) => s.syncStatus);
  const visitCounts = useVisitStore((s) => s.visitCounts);
  const visitCountsByYear = useVisitStore((s) => s.visitCountsByYear);
  const recentTrips = useVisitStore((s) => s.recentTrips);
  const availableYears = useVisitStore((s) => s.availableYears);
  const ensureYearCounts = useVisitStore((s) => s.ensureYearCounts);
  const lastSync = useVisitStore((s) => s.lastSync);
  const setLastSync = useVisitStore((s) => s.setLastSync);
  const homeCleanupReport = useVisitStore((s) => s.homeCleanupReport);
  const setHomeCleanupReport = useVisitStore((s) => s.setHomeCleanupReport);
  const themeHydrate = useThemeStore((s) => s.hydrate);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const activeBadgeId = useBadgeStore((s) => s.activeId);
  const pendingNotifications = useBadgeStore((s) => s.pendingNotifications);
  const consumeBadgeNotifications = useBadgeStore((s) => s.consumeNotifications);
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  useSystemSchemeListener();
  const [screen, setScreen] = useState<
    "main" | "addTrip" | "settings" | "titles" | "mapZoom"
  >("main");
  const [yearMode, setYearMode] = useState<YearMode>({ kind: "all" });
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [mapInteracting, setMapInteracting] = useState(false);

  useEffect(() => {
    void hydrate();
    void themeHydrate();
  }, [hydrate, themeHydrate]);

  useEffect(() => {
    if (yearMode.kind === "year") {
      void ensureYearCounts(yearMode.year);
    }
  }, [yearMode, ensureYearCounts]);

  useEffect(() => {
    if (!lastSync) return;
    if (syncStatus.running) return;
    const lines = [
      `권한: ${lastSync.permission}`,
      `사진 ${lastSync.scanned}장 확인`,
      `GPS 있음: ${lastSync.withGps}장`,
      `국가 매칭: ${lastSync.resolved}장`,
      `DB 추가: ${lastSync.added}장`,
    ];
    if (lastSync.error) lines.push(`에러: ${lastSync.error}`);
    Alert.alert("스캔 결과", lines.join("\n"), [
      { text: "확인", onPress: () => setLastSync(null) },
    ]);
  }, [lastSync, syncStatus.running, setLastSync]);

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

  const activeCounts = useMemo(() => {
    if (yearMode.kind === "year") {
      return visitCountsByYear[yearMode.year] ?? {};
    }
    return visitCounts;
  }, [yearMode, visitCounts, visitCountsByYear]);

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

  const openSettings = () => setScreen("settings");

  if (!ready || !themeHydrated) {
    return <View style={styles.root} />;
  }

  if (!homeCountry) {
    return (
      <GestureHandlerRootView style={styles.rootDark}>
        <StatusBar style="light" />
        <OnboardingScreen />
      </GestureHandlerRootView>
    );
  }

  if (screen === "addTrip") {
    return (
      <GestureHandlerRootView style={styles.rootDark}>
        <StatusBar style="light" />
        <AddTripScreen onClose={() => setScreen("main")} />
      </GestureHandlerRootView>
    );
  }

  if (screen === "settings") {
    return (
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style={theme.statusBar} />
        <SettingsScreen
          onClose={() => setScreen("main")}
          onAddTrip={() => setScreen("addTrip")}
          onOpenTitles={() => setScreen("titles")}
        />
      </GestureHandlerRootView>
    );
  }

  if (screen === "titles") {
    return (
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style={theme.statusBar} />
        <TitlesScreen onClose={() => setScreen("settings")} />
      </GestureHandlerRootView>
    );
  }

  if (screen === "mapZoom") {
    return (
      <GestureHandlerRootView style={styles.root}>
        <MapZoomScreen
          visitCounts={activeCounts}
          onClose={() => setScreen("main")}
        />
      </GestureHandlerRootView>
    );
  }

  const percent =
    Math.round((totals.countries / TOTAL_COUNTRIES) * 1000) / 10;

  return (
    <GestureHandlerRootView style={styles.root}>
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
            onPress={openSettings}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
          >
            <Text style={styles.iconBtnText}>⚙︎</Text>
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
            onPress={() => setScreen("mapZoom")}
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
            onPress={() =>
              Alert.alert("준비 중", "전체보기는 곧 추가됩니다.")
            }
            hitSlop={8}
          >
            <Text style={styles.allLink}>전체보기 →</Text>
          </Pressable>
        </View>
        <RecentList theme={theme} trips={recentTrips} />
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
    </GestureHandlerRootView>
  );
}

function MiniCard({
  theme,
  homeCode,
  visitCounts,
}: {
  theme: Theme;
  homeCode: string;
  visitCounts: Record<string, number>;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const selectedCountry = useVisitStore((s) => s.selectedCountry);
  const code = selectedCountry?.code ?? homeCode;
  const name = selectedCountry?.name ?? "";
  const isHome = code === homeCode;
  const visitDays = visitCounts[code] ?? 0;
  const shapeColor = colorForVisitWith(theme, {
    count: visitDays,
    isHomeCountry: isHome,
  });

  return (
    <View style={styles.miniCard}>
      <View style={styles.miniBadge}>
        <Text style={styles.miniBadgeText}>{isHome ? "본국" : "선택"}</Text>
      </View>
      <View style={styles.miniDotsArea}>
        <CountryShape countryCode={code} color={shapeColor} />
      </View>
      <Text style={styles.miniTitle} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.miniSub}>
        {isHome ? "본국" : `${visitDays}일 방문`}
      </Text>
    </View>
  );
}

function RecentList({ theme, trips }: { theme: Theme; trips: RecentTrip[] }) {
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
  const display = trips.slice(0, 8);
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
            onPress={() =>
              Alert.alert(
                koName,
                `${y}.${m}.${d} 시작 · ${item.days}일 머무름`
              )
            }
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
    iconBtnText: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "700",
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
