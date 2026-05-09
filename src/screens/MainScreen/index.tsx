import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import AddTripActionSheet from "../../components/AddTripActionSheet";
import DotMap from "../../components/DotMap";
import YearPickerModal from "../../components/YearPickerModal";
import { runIncrementalSync } from "../../features/photoSync/syncService";
import { localizedBadgeTitle } from "../../features/badges/badgeI18n";
import { badgeFromId } from "../../features/badges/badges";
import { COUNTRY_NAME_KO_BY_CODE as BADGE_KO_NAMES } from "../../features/badges/countryNames";
import { pickActiveBadge, useBadgeStore } from "../../features/badges/badgeStore";
import ShareMapModal from "../../features/share/ShareMapModal";
import { formatShareYearLabel } from "../../features/share/yearLabel";
import { getTierByCount } from "../../features/travel/tierTitles";
import { evaluateMilestone } from "../../features/milestone/milestoneEvaluator";
import { useMilestoneStore } from "../../features/milestone/milestoneStore";
import { useVisitStore } from "../../features/travel/visitStore";
import { useScreenBottomInset } from "../../hooks/useScreenInsets";
import { getCurrentLocale } from "../../i18n";
import { getCountryName } from "../../lib/countryName";
import { useAppCtx } from "../../navigation/AppCtx";
import type { MainTabParamList, RootStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/themeStore";
import MapActions from "./MapActions";
import MiniCard from "./MiniCard";
import { MilestoneFooterText } from "./MilestoneFooterText";
import RecentList from "./RecentList";
import {
  loadMapExtraHeight,
  saveMapExtraHeight,
} from "./mapHeightStorage";
import { makeStyles, TOP_BAR_HEIGHT } from "./styles";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// 지도 자연 비율(360:145)에 화면 폭을 맞춘 기본 높이.
// 사용자가 지도 하단을 끌어내리면 이 기본 높이에 추가 높이(extra)를 더해 키운다.
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const MAP_DEFAULT_HEIGHT = Math.round((SCREEN_WIDTH * 145) / 360);
// 화면이 지도 위주가 되어버리지 않도록 화면 높이의 절반 이내로 제한한다.
const MAP_MAX_EXTRA = Math.max(
  0,
  Math.round(SCREEN_HEIGHT * 0.55) - MAP_DEFAULT_HEIGHT
);

// 지도 하단 드래그 핸들의 어트랜션 애니메이션은 앱 실행 중 한 번만 보여 준다.
// 모듈 레벨 플래그라 화면 재진입에는 다시 재생되지 않지만, 앱이 종료/재시작되면
// 다시 false로 초기화되어 새 세션에서 한 번 더 재생된다.
let mapHandleHintShown = false;

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function MainScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { yearMode, setYearMode, activeCounts } = useAppCtx();
  const visitCounts = useVisitStore((s) => s.visitCounts);
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const recentTrips = useVisitStore((s) => s.recentTrips);
  const availableYears = useVisitStore((s) => s.availableYears);
  const setSelectedCountry = useVisitStore((s) => s.setSelectedCountry);
  const activeBadgeId = useBadgeStore((s) => s.activeId);
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [mapInteracting, setMapInteracting] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // TopAppBar hide-on-scroll: 위로 4px 이상 스크롤하면 숨기고, 아래로 4px 이상
  // 스크롤하면 다시 보인다. 컨텐츠 최상단(<=0)에서는 항상 보이게 강제한다.
  const topBarTranslateY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const dy = y - lastScrollY.value;
      if (y <= 0) {
        topBarTranslateY.value = withTiming(0, { duration: 320 });
      } else if (dy > 4) {
        topBarTranslateY.value = withTiming(-TOP_BAR_HEIGHT, { duration: 320 });
      } else if (dy < -4) {
        topBarTranslateY.value = withTiming(0, { duration: 320 });
      }
      lastScrollY.value = y;
    },
  });
  const topBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: topBarTranslateY.value }],
  }));

  // 지도 영역 높이 가변. 사용자는 하단 핸들을 잡고 아래로 끌어 키우거나
  // 위로 다시 밀어 줄일 수 있다. 마지막 사이즈는 영속화해 다음 실행에 복원한다.
  const mapExtraHeight = useSharedValue(0);
  const mapExtraSaved = useSharedValue(0);
  // 드래그 중에만 animated 높이가 부모 정적 높이를 덮어쓰도록 하는 게이트.
  const draggingActive = useSharedValue(false);
  // 정착된 높이의 JS state 미러. 부모 정적 height에 직접 박아 React commit 시점에
  // 부모가 올바른 높이로 layout되게 한다. shared value만 쓰면 worklet의 UI-스레드
  // 적용 순서와 React commit 순서가 어긋나, 첫 onLayout이 짧은 기본 높이로
  // 발화되고 인트로가 잘못된 viewport 기준으로 큐잉되는 race가 생긴다.
  const [extraHeightSettled, setExtraHeightSettled] = useState(0);
  // 저장된 높이가 비동기로 들어오기 전에 DotMap이 마운트되어 onLayout 받으면
  // 인트로 애니메이션이 잘못된(짧은) 사이즈 기준으로 큐잉된다. 그래서 저장값
  // 적용이 끝난 뒤에야 DotMap을 렌더해 첫 onLayout이 올바른 사이즈로 들어오게 한다.
  const [mapHeightHydrated, setMapHeightHydrated] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadMapExtraHeight().then((v) => {
      if (cancelled) return;
      if (v != null) {
        const clamped = Math.max(0, Math.min(MAP_MAX_EXTRA, v));
        mapExtraHeight.value = clamped;
        mapExtraSaved.value = clamped;
        setExtraHeightSettled(clamped);
      }
      setMapHeightHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mapExtraHeight, mapExtraSaved]);
  const commitMapExtra = useCallback((value: number) => {
    setExtraHeightSettled(value);
    saveMapExtraHeight(value).catch(() => {});
  }, []);
  const triggerDragHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);
  const mapResizeGesture = useMemo(
    () =>
      Gesture.Pan()
        // 손잡이를 약 0.1초 눌러야 pan이 활성화된다. 이 활성화 순간에 햅틱이
        // 울려 "지금부터 드래그 가능"이라는 신호를 준다.
        .activateAfterLongPress(100)
        .onStart(() => {
          mapExtraSaved.value = mapExtraHeight.value;
          draggingActive.value = true;
          // 부모 ScrollView가 같이 스크롤되지 않도록 잠근다.
          runOnJS(setMapInteracting)(true);
          runOnJS(triggerDragHaptic)();
        })
        .onUpdate((e) => {
          const next = mapExtraSaved.value + e.translationY;
          mapExtraHeight.value = Math.max(0, Math.min(MAP_MAX_EXTRA, next));
        })
        .onEnd(() => {
          mapExtraSaved.value = mapExtraHeight.value;
          runOnJS(commitMapExtra)(mapExtraHeight.value);
        })
        .onFinalize(() => {
          // draggingActive는 여기서 끄지 않는다. setExtraHeightSettled의 React
          // commit이 정적 높이를 새 값으로 반영한 직후에 useEffect로 끄면,
          // animated→정적 전환 사이의 한 프레임 깜빡임이 사라진다. 또한 onEnd
          // 없이 종료되는 cancel 경로에서는 draggingActive가 true로 남아 animated가
          // 마지막 드래그 위치를 그대로 유지한다(원래 동작 보존).
          runOnJS(setMapInteracting)(false);
        }),
    [mapExtraHeight, mapExtraSaved, draggingActive, commitMapExtra, triggerDragHaptic]
  );
  // setExtraHeightSettled가 commit된 직후(=정적 높이가 새 값으로 적용된 직후)에
  // animated 게이트를 푼다. cancel로 commit 없이 끝난 경우엔 fire되지 않으므로
  // animated가 계속 살아있어 드래그한 위치가 그대로 유지된다.
  useEffect(() => {
    draggingActive.value = false;
  }, [extraHeightSettled, draggingActive]);
  // 드래그 중에만 부모의 정적 height를 override한다. 그 외에는 정적 스타일이
  // 그대로 적용되어, 첫 렌더에 worklet 적용 순서와 무관하게 부모가 정확한 높이로
  // layout된다.
  const mapAreaAnimStyle = useAnimatedStyle(() => {
    if (!draggingActive.value) return {};
    return { height: MAP_DEFAULT_HEIGHT + mapExtraHeight.value };
  });

  // 지도 하단 핸들 어트랜션. 가로로 살짝 늘었다 줄고, 약간 아래로 튕기며,
  // 동시에 투명도가 펄스해 "여기를 잡고 끌 수 있다"는 시선을 유도한다.
  const hintScaleX = useSharedValue(1);
  const hintOpacity = useSharedValue(1);
  const hintTranslateY = useSharedValue(0);
  useEffect(() => {
    if (mapHandleHintShown) return;
    if (!homeCountry) return;
    if (!mapHeightHydrated) return;
    mapHandleHintShown = true;
    // 인트로(500ms 지연 + 3000ms 줌아웃 = 3500ms)가 끝나는 시점에 펄스가 시작되도록.
    const startDelay = 3500;
    // 3회 반복 총 시간 1600ms 이내(266 * 2 * 3 = 1596ms).
    const halfCycle = 266;
    const cycles = 3;
    hintScaleX.value = withDelay(
      startDelay,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration: halfCycle }),
          withTiming(1, { duration: halfCycle })
        ),
        cycles,
        false
      )
    );
    hintOpacity.value = withDelay(
      startDelay,
      withRepeat(
        withSequence(
          withTiming(0.4, { duration: halfCycle }),
          withTiming(1, { duration: halfCycle })
        ),
        cycles,
        false
      )
    );
    hintTranslateY.value = withDelay(
      startDelay,
      withRepeat(
        withSequence(
          withTiming(4, { duration: halfCycle }),
          withTiming(0, { duration: halfCycle })
        ),
        cycles,
        false
      )
    );
  }, [homeCountry, mapHeightHydrated, hintScaleX, hintOpacity, hintTranslateY]);
  const hintBarStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
    transform: [
      { translateY: hintTranslateY.value },
      { scaleX: hintScaleX.value },
    ],
  }));

  const totals = useMemo(() => {
    const codes = Object.keys(activeCounts);
    let days = 0;
    for (const c of codes) days += activeCounts[c] ?? 0;
    return { countries: codes.length, days };
  }, [activeCounts]);

  const milestoneKind = useMilestoneStore((s) => s.kind);
  const milestoneProgress = useMemo(
    () => evaluateMilestone(milestoneKind, visitCounts),
    [milestoneKind, visitCounts]
  );

  const tier = useMemo(
    () => getTierByCount(totals.countries),
    [totals.countries]
  );

  // 활성 뱃지: 사용자 선택이 있으면 그것, 없으면 현재 등급 뱃지
  const activeBadge = useMemo(
    () => pickActiveBadge(activeBadgeId, `tier_${tier.id}`, BADGE_KO_NAMES),
    [activeBadgeId, tier.id]
  );

  const shareYearLabel = useMemo(
    () => formatShareYearLabel(yearMode, availableYears),
    [yearMode, availableYears]
  );
  const shareBadgeTitle = useMemo(
    () =>
      activeBadge
        ? localizedBadgeTitle(activeBadge, t, getCurrentLocale())
        : null,
    [activeBadge, t]
  );

  // 다음 목표 호칭 라벨 (예: "아시아 전문가")
  const nextTitleLabel = useMemo(() => {
    const id = milestoneProgress.nextTitleBadgeId;
    if (!id) return "";
    const badge = badgeFromId(id, BADGE_KO_NAMES);
    if (!badge) return "";
    return localizedBadgeTitle(badge, t, getCurrentLocale());
  }, [milestoneProgress.nextTitleBadgeId, t]);

  const openYearPicker = () => {
    if (availableYears.length === 0) {
      Alert.alert(
        t("home.yearPickerEmptyTitle"),
        t("home.yearPickerEmptyBody")
      );
      return;
    }
    setYearPickerOpen(true);
  };


  if (!homeCountry) return null;

  return (
    <View style={[styles.root, { paddingBottom: bottomInset }]}>
      <StatusBar style={theme.statusBar} />
      <Animated.View style={[styles.topAppBar, topBarStyle]}>
        <Text style={styles.topAppBarTitle}>TravelDot</Text>
        <View style={styles.topAppBarActions}>
          <Pressable
            onPress={() => navigation.navigate("AllCountries")}
            hitSlop={8}
            style={({ pressed }) => [
              styles.menuBtn,
              pressed && styles.menuBtnPressed,
            ]}
          >
            <Image
              source={require("../../../assets/all_country_flag.png")}
              style={styles.menuBtnImage}
              resizeMode="contain"
            />
          </Pressable>
        </View>
      </Animated.View>
      <AnimatedScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!mapInteracting}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={styles.mapStatsCard}>
          <View style={styles.mapStatsHeader}>
            <View style={styles.headerLeft}>
              {activeBadge ? (
                <Pressable
                  onPress={() => navigation.navigate("Titles")}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.headerBadgeChip,
                    pressed && styles.headerBadgeChipPressed,
                  ]}
                >
                  <Text style={styles.headerBadgeChipText} numberOfLines={1}>
                    {activeBadge.emoji}{" "}
                    {localizedBadgeTitle(activeBadge, t, getCurrentLocale())}
                  </Text>
                </Pressable>
              ) : null}
              <View style={styles.headerStatRow}>
                <Text style={styles.headerStatNum}>{totals.countries}</Text>
                <Text style={styles.headerStatUnit}>
                  {" "}
                  {t("home.countriesUnit")}
                </Text>
                <Text style={styles.headerStatDot}> · </Text>
                <Text style={styles.headerStatNum}>{totals.days}</Text>
                <Text style={styles.headerStatUnit}> {t("home.daysUnit")}</Text>
              </View>
            </View>
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
                  {t("home.all")}
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
                  {yearMode.kind === "year"
                    ? t("home.yearPickerSelected", { year: yearMode.year })
                    : t("home.yearPicker")}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.mapStatsDivider} />

          <View style={styles.mapWrap}>
            <Animated.View
              style={[
                styles.mapArea,
                { height: MAP_DEFAULT_HEIGHT + extraHeightSettled },
                mapAreaAnimStyle,
              ]}
            >
              {mapHeightHydrated ? (
                <DotMap
                  visitCounts={activeCounts}
                  onInteractingChange={setMapInteracting}
                  mapAreaStyle={styles.mapAreaInner}
                />
              ) : null}
            </Animated.View>
            <GestureDetector gesture={mapResizeGesture}>
              <View style={styles.mapResizeZone}>
                <Animated.View style={[styles.mapResizeBar, hintBarStyle]} />
              </View>
            </GestureDetector>
          </View>
        </View>
        <MapActions
          styles={styles}
          onShare={() => setShareModalOpen(true)}
          onZoom={() => navigation.navigate("MapZoom")}
          shareA11yLabel={t("home.shareBtnA11y")}
          zoomA11yLabel={t("home.zoomBtnA11y")}
        />

        <View style={styles.statsRow}>
          <MiniCard
            theme={theme}
            homeCode={homeCountry.code}
            visitCounts={activeCounts}
            onPress={() => navigation.navigate("CountryDetail")}
          />
          <Pressable
            onPress={() => navigation.navigate("Milestones")}
            style={({ pressed }) => [
              styles.statCard,
              pressed && styles.statCardPressed,
            ]}
          >
            <Text style={styles.statFooterLabel}>
              <MilestoneFooterText
                progress={milestoneProgress}
                nextTitleLabel={nextTitleLabel}
                strongStyle={styles.statFooterStrong}
              />
            </Text>
            <View style={styles.statBigRow}>
              <Text style={styles.statBigNum}>{milestoneProgress.current}</Text>
              <Text style={styles.statBigDenom}>
                {milestoneProgress.next != null
                  ? ` / ${milestoneProgress.next}`
                  : ""}
              </Text>
              <Text style={styles.statBigPercent}>
                {"  "}{milestoneProgress.percent}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${milestoneProgress.percent}%` },
                ]}
              />
            </View>
          </Pressable>
        </View>

        <View style={styles.recentHeader}>
          <View style={styles.recentHeaderLeft}>
            <Text style={styles.sectionTitle}>{t("home.recentTitle")}</Text>
            <Pressable
              onPress={() => setAddSheetOpen(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.recentAddBtn,
                pressed && styles.recentAddBtnPressed,
              ]}
            >
              <Text style={styles.recentAddIcon}>+</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => navigation.navigate("History")}
            hitSlop={8}
          >
            <Text style={styles.allLink}>{t("home.viewAll")}</Text>
          </Pressable>
        </View>
        <RecentList
          theme={theme}
          trips={recentTrips}
          onSelect={(trip) => navigation.navigate("TripDetail", { trip })}
          onSelectCountry={(trip) => {
            setSelectedCountry({
              code: trip.countryCode,
              name: getCountryName(trip.countryCode, getCurrentLocale()),
            });
            navigation.navigate("CountryDetail");
          }}
        />
      </AnimatedScrollView>
      <YearPickerModal
        visible={yearPickerOpen}
        initial={yearMode}
        onCancel={() => setYearPickerOpen(false)}
        onApply={(mode) => {
          setYearMode(mode);
          setYearPickerOpen(false);
        }}
      />
      <AddTripActionSheet
        visible={addSheetOpen}
        onCancel={() => setAddSheetOpen(false)}
        onManual={() => {
          setAddSheetOpen(false);
          navigation.navigate("AddTrip");
        }}
        onAutoScan={() => {
          setAddSheetOpen(false);
          runIncrementalSync().catch((e) =>
            Alert.alert(t("scan.scanFailed"), String(e))
          );
        }}
      />
      <ShareMapModal
        visible={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        theme={theme}
        visitCounts={activeCounts}
        badgeEmoji={activeBadge?.emoji ?? null}
        badgeTitle={shareBadgeTitle}
        countries={totals.countries}
        days={totals.days}
        yearLabel={shareYearLabel}
      />
    </View>
  );
}
