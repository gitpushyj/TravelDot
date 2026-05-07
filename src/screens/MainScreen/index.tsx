import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import DotMap from "../../components/DotMap";
import YearPickerModal from "../../components/YearPickerModal";
import {
  localizedBadgeTitle,
  localizedTierTitle,
} from "../../features/badges/badgeI18n";
import { COUNTRY_NAME_KO_BY_CODE as BADGE_KO_NAMES } from "../../features/badges/countryNames";
import { pickActiveBadge, useBadgeStore } from "../../features/badges/badgeStore";
import {
  getTierByCount,
  TIER_CUTOFFS,
} from "../../features/travel/tierTitles";
import { useVisitStore } from "../../features/travel/visitStore";
import { getCurrentLocale } from "../../i18n";
import { TOTAL_COUNTRIES } from "../../lib/countryLookup";
import { useAppCtx } from "../../navigation/AppCtx";
import type { RootStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/themeStore";
import MiniCard from "./MiniCard";
import RecentList from "./RecentList";
import { makeStyles, TOP_BAR_HEIGHT } from "./styles";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function MainScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Main">) {
  const { t } = useTranslation();
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

  const totals = useMemo(() => {
    const codes = Object.keys(activeCounts);
    let days = 0;
    for (const c of codes) days += activeCounts[c] ?? 0;
    return { countries: codes.length, days };
  }, [activeCounts]);

  const milestone = useMemo(() => {
    const visited = totals.countries;
    const next = TIER_CUTOFFS.find((m) => m > visited) ?? TOTAL_COUNTRIES;
    return { next };
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

  const percent =
    Math.round((totals.countries / milestone.next) * 1000) / 10;

  if (!homeCountry) return null;

  return (
    <View style={styles.root}>
      <StatusBar style={theme.statusBar} />
      <Animated.View style={[styles.topAppBar, topBarStyle]}>
        <Text style={styles.topAppBarTitle}>VisitGrid</Text>
        <Pressable
          onPress={() => navigation.navigate("Settings")}
          hitSlop={8}
          style={({ pressed }) => [
            styles.menuBtn,
            pressed && styles.menuBtnPressed,
          ]}
        >
          <Text style={styles.menuBtnIcon}>☰</Text>
        </Pressable>
      </Animated.View>
      <AnimatedScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!mapInteracting}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {syncStatus.running && (
          <View style={styles.syncBar}>
            <Text style={styles.syncText}>
              {t("home.syncing", { processed: syncStatus.processed })}
            </Text>
          </View>
        )}

        <View style={styles.mapStatsCard}>
          <View style={styles.mapStatsHeader}>
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
            <DotMap
              visitCounts={activeCounts}
              onInteractingChange={setMapInteracting}
            />
            <Pressable
              onPress={() => navigation.navigate("MapZoom")}
              hitSlop={8}
              style={({ pressed }) => [
                styles.mapFloatingBtn,
                pressed && styles.mapFloatingBtnPressed,
              ]}
            >
              <Text style={styles.mapFloatingBtnIcon}>⛶</Text>
            </Pressable>
          </View>
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
              <Text style={styles.statTitle}>{t("home.statTitle")}</Text>
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
                  ? `${activeBadge.emoji} ${localizedBadgeTitle(activeBadge, t, getCurrentLocale())}`
                  : localizedTierTitle(tier, t)}
              </Text>
            </View>
            <View style={styles.statBigRow}>
              <Text style={styles.statBigNum}>{totals.countries}</Text>
              <Text style={styles.statBigDenom}> / {milestone.next}</Text>
              <Text style={styles.statBigPercent}>  {percent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      (totals.countries / milestone.next) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.statFooter}>
              <Text style={styles.statFooterLabel}>
                {t("home.nextMilestone")}{" "}
                <Text style={styles.statFooterStrong}>
                  {t("home.milestoneCountries", { count: milestone.next })}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.recentHeader}>
          <View style={styles.recentHeaderLeft}>
            <Text style={styles.sectionTitle}>{t("home.recentTitle")}</Text>
            <Pressable
              onPress={() => navigation.navigate("AddTrip")}
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
        />

        <Pressable
          onPress={() => navigation.navigate("AllCountries")}
          style={({ pressed }) => [
            styles.allCountriesBtn,
            pressed && styles.allCountriesBtnPressed,
          ]}
        >
          <Text style={styles.allCountriesIcon}>🌍</Text>
          <Text style={styles.allCountriesText}>
            {t("home.viewAllCountries")}
          </Text>
          <Text style={styles.allCountriesChev}>›</Text>
        </Pressable>
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
    </View>
  );
}
