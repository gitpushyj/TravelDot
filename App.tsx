import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import CountryShape from "./src/components/CountryShape";
import DotMap from "./src/components/DotMap";
import YearPickerModal from "./src/components/YearPickerModal";
import {
  runFullSync,
  runIncrementalSync,
} from "./src/features/photoSync/syncService";
import type { RecentTrip } from "./src/features/travel/visitRepository";
import { useVisitStore } from "./src/features/travel/visitStore";
import AddTripScreen from "./src/screens/AddTripScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import countriesJson from "./assets/data/countries.json";
import { flagEmoji } from "./src/utils/flag";
import {
  ACCENT,
  ACCENT_SOFT_BG,
  ACCENT_SOFT_TEXT,
  CARD_BG,
  CARD_BORDER,
  colorForVisit,
  HOME_BG,
  TAB_ROW_BG,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "./src/utils/heatmap";

const TOTAL_COUNTRIES = 195;
const MILESTONES = [5, 10, 15, 25, 50, 100, 150, 195];

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
  const [screen, setScreen] = useState<"main" | "addTrip">("main");
  const [yearMode, setYearMode] = useState<YearMode>({ kind: "all" });
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [mapInteracting, setMapInteracting] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

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
    const next = MILESTONES.find((m) => m > visited) ?? TOTAL_COUNTRIES;
    return { next, remaining: Math.max(0, next - visited) };
  }, [totals.countries]);

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

  const openMenu = () => {
    const options = ["여행 추가", "새 사진 자동 추가", "사진 재스캔", "취소"];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 3 },
        (idx) => {
          if (idx === 0) setScreen("addTrip");
          else if (idx === 1) {
            runIncrementalSync().catch((e) =>
              Alert.alert("스캔 실패", String(e))
            );
          } else if (idx === 2) {
            runFullSync().catch((e) => Alert.alert("스캔 실패", String(e)));
          }
        }
      );
    } else {
      Alert.alert("메뉴", undefined, [
        { text: "여행 추가", onPress: () => setScreen("addTrip") },
        {
          text: "새 사진 자동 추가",
          onPress: () =>
            runIncrementalSync().catch((e) =>
              Alert.alert("스캔 실패", String(e))
            ),
        },
        {
          text: "사진 재스캔",
          onPress: () =>
            runFullSync().catch((e) => Alert.alert("스캔 실패", String(e))),
        },
        { text: "취소", style: "cancel" },
      ]);
    }
  };

  if (!ready) {
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

  const percent =
    Math.round((totals.countries / TOTAL_COUNTRIES) * 1000) / 10;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
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
            onPress={openMenu}
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
            onPress={() =>
              Alert.alert("준비 중", "전체화면 보기는 곧 추가됩니다.")
            }
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
            homeCode={homeCountry.code}
            visitCounts={activeCounts}
          />
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <Text style={styles.statTitle}>방문 국가</Text>
              <Text style={styles.statTotal}>전 세계 {TOTAL_COUNTRIES}</Text>
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
        <RecentList trips={recentTrips} />
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
  homeCode,
  visitCounts,
}: {
  homeCode: string;
  visitCounts: Record<string, number>;
}) {
  const selectedCountry = useVisitStore((s) => s.selectedCountry);
  const code = selectedCountry?.code ?? homeCode;
  const name = selectedCountry?.name ?? "";
  const isHome = code === homeCode;
  const visitDays = visitCounts[code] ?? 0;
  const shapeColor = colorForVisit({
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

function RecentList({ trips }: { trips: RecentTrip[] }) {
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
              pressed && { backgroundColor: "#f7f4ec" },
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HOME_BG,
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
    color: TEXT_SECONDARY,
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
    color: TEXT_PRIMARY,
    fontSize: 28,
    fontWeight: "800",
  },
  headerStatUnit: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: "600",
  },
  headerStatDot: {
    color: TEXT_MUTED,
    fontSize: 18,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPressed: { backgroundColor: TAB_ROW_BG },
  iconBtnText: {
    color: TEXT_PRIMARY,
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
    backgroundColor: TAB_ROW_BG,
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
    backgroundColor: CARD_BG,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: TEXT_PRIMARY,
    fontWeight: "700",
  },
  syncBar: {
    marginHorizontal: 20,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: CARD_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  syncText: { color: ACCENT_SOFT_TEXT, fontSize: 12, fontWeight: "600" },
  mapWrap: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
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
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 12,
    minHeight: 140,
  },
  miniBadge: {
    alignSelf: "flex-start",
    backgroundColor: TAB_ROW_BG,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  miniBadgeText: {
    color: TEXT_PRIMARY,
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
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "700",
  },
  miniSub: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    marginTop: 2,
  },
  statCard: {
    flex: 1.5,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
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
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: "600",
  },
  statTotal: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: "600",
  },
  statBigRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  statBigNum: {
    color: TEXT_PRIMARY,
    fontSize: 30,
    fontWeight: "800",
  },
  statBigDenom: {
    color: TEXT_MUTED,
    fontSize: 14,
    fontWeight: "600",
  },
  statBigPercent: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: TAB_ROW_BG,
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  statFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statFooterLabel: {
    color: TEXT_SECONDARY,
    fontSize: 11,
  },
  statFooterStrong: {
    color: TEXT_PRIMARY,
    fontWeight: "700",
  },
  statFooterAccent: {
    color: ACCENT,
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
    color: TEXT_PRIMARY,
    fontSize: 17,
    fontWeight: "800",
  },
  allLink: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "700",
  },
  rowSep: { height: 1, backgroundColor: CARD_BORDER, marginLeft: 20 },
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
    backgroundColor: "#fce6e0",
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
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: "700",
  },
  recentCode: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: "600",
  },
  recentBadge: {
    marginLeft: 6,
    backgroundColor: ACCENT_SOFT_BG,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recentBadgeText: {
    color: ACCENT_SOFT_TEXT,
    fontSize: 10,
    fontWeight: "800",
  },
  recentDate: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    marginTop: 2,
  },
  chev: {
    color: TEXT_MUTED,
    fontSize: 22,
    fontWeight: "400",
  },
  emptyWrap: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    textAlign: "center",
  },
});
