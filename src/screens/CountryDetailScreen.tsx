import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  countPhotosForCountry,
  countPhotosForTrip,
  loadTripsForCountry,
  RecentTrip,
} from "../features/travel/visitRepository";
import { useVisitStore } from "../features/travel/visitStore";
import { flagEmoji } from "../utils/flag";
import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";

type Props = {
  onClose: () => void;
  onSelectTrip?: (trip: RecentTrip) => void;
};

type TripWithPhotos = RecentTrip & { photos: number };

// 여행 카드 썸네일 색을 시작일 기반으로 결정해 시각적으로 구분되도록 한다.
const TRIP_COLORS = [
  ["#f4b27a", "#c97a3a"], // 오렌지
  ["#9ec5e3", "#5a8db4"], // 블루
  ["#e6a3ad", "#b06f7c"], // 핑크
  ["#d8c479", "#9c8a3b"], // 골드
  ["#a7c6a6", "#5f8862"], // 그린
  ["#b9a9d4", "#7a679f"], // 퍼플
];

function colorPairForTrip(trip: RecentTrip): [string, string] {
  let h = 0;
  for (let i = 0; i < trip.startDate.length; i += 1) {
    h = (h * 31 + trip.startDate.charCodeAt(i)) >>> 0;
  }
  const pair = TRIP_COLORS[h % TRIP_COLORS.length];
  return [pair[0], pair[1]];
}

export default function CountryDetailScreen({ onClose, onSelectTrip }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const selectedCountry = useVisitStore((s) => s.selectedCountry);

  const [trips, setTrips] = useState<TripWithPhotos[] | null>(null);
  const [photoTotal, setPhotoTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedCountry) return;
    let cancelled = false;
    void (async () => {
      const code = selectedCountry.code;
      const rawTrips = await loadTripsForCountry(code);
      const total = await countPhotosForCountry(code);
      const counts = await Promise.all(
        rawTrips.map((t) => countPhotosForTrip(t.countryCode, t.startDate, t.endDate))
      );
      if (cancelled) return;
      setTrips(rawTrips.map((t, i) => ({ ...t, photos: counts[i] })));
      setPhotoTotal(total);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCountry?.code]);

  const totalDays = useMemo(
    () => (trips ? trips.reduce((acc, t) => acc + t.days, 0) : 0),
    [trips]
  );

  const grouped = useMemo(() => groupByYear(trips ?? []), [trips]);

  if (!selectedCountry) {
    return <View style={styles.root} />;
  }

  const flag = flagEmoji(selectedCountry.code);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.iconBtnPressed,
          ]}
        >
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerFlag}>{flag}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedCountry.name}
          </Text>
          <Text style={styles.headerCode}>{selectedCountry.code}</Text>
        </View>
        <View style={styles.iconBtn} pointerEvents="none">
          <View />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsCard}>
          <StatCol value={trips?.length ?? 0} unit="회 방문" />
          <View style={styles.statDivider} />
          <StatCol value={totalDays} unit="일 누적" />
          <View style={styles.statDivider} />
          <StatCol value={photoTotal ?? 0} unit="장의 사진" />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>여행 기록</Text>
          <Text style={styles.sortLabel}>최신순</Text>
        </View>

        {trips == null ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>불러오는 중…</Text>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              아직 이 나라의 여행 기록이 없어요.
            </Text>
          </View>
        ) : (
          grouped.map((g) => (
            <View key={g.year} style={styles.yearGroup}>
              <View style={styles.yearHeader}>
                <Text style={styles.yearLabel}>{g.year}</Text>
                <View style={styles.yearLine} />
              </View>
              {g.trips.map((trip, idx) => {
                const isMostRecent = g === grouped[0] && idx === 0;
                return (
                  <TripRow
                    key={`${trip.startDate}-${trip.endDate}`}
                    theme={theme}
                    trip={trip}
                    showRecent={isMostRecent}
                    onPress={() => onSelectTrip?.(trip)}
                  />
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function StatCol({ value, unit }: { value: number; unit: string }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.statCol}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

function TripRow({
  theme,
  trip,
  showRecent,
  onPress,
}: {
  theme: Theme;
  trip: TripWithPhotos;
  showRecent: boolean;
  onPress: () => void;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [light, dark] = colorPairForTrip(trip);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tripCard,
        pressed && { backgroundColor: theme.rowPressedBg },
      ]}
    >
      <View style={[styles.tripThumb, { backgroundColor: light }]}>
        <View style={[styles.tripThumbInner, { backgroundColor: dark }]} />
        <View style={styles.tripThumbBadge}>
          <Text style={styles.tripThumbBadgeText}>{trip.photos}장</Text>
        </View>
      </View>
      <View style={styles.tripBody}>
        <View style={styles.tripTitleRow}>
          <Text style={styles.tripDate}>
            {formatMD(trip.startDate)} — {formatMD(trip.endDate)}
          </Text>
          {showRecent && (
            <View style={styles.recentBadge}>
              <Text style={styles.recentBadgeText}>최근</Text>
            </View>
          )}
        </View>
        <Text style={styles.tripSub}>
          {trip.days === 1 ? "1일 (당일)" : `${trip.days}일 여행`}
        </Text>
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

type YearGroup = { year: number; trips: TripWithPhotos[] };

function groupByYear(trips: TripWithPhotos[]): YearGroup[] {
  const map = new Map<number, TripWithPhotos[]>();
  for (const t of trips) {
    const y = Number(t.startDate.slice(0, 4));
    const arr = map.get(y) ?? [];
    arr.push(t);
    map.set(y, arr);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, list]) => ({ year, trips: list }));
}

function formatMD(date: string): string {
  return `${date.slice(5, 7)}·${date.slice(8, 10)}`;
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 56,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    iconBtnPressed: { backgroundColor: theme.tabRowBg },
    iconBtnText: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "600",
      lineHeight: 24,
    },
    headerCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
      gap: 6,
    },
    headerFlag: { fontSize: 18 },
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    headerCode: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 60,
    },
    statsCard: {
      flexDirection: "row",
      backgroundColor: theme.cardBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingVertical: 18,
      paddingHorizontal: 8,
      marginBottom: 28,
    },
    statCol: {
      flex: 1,
      alignItems: "center",
      gap: 4,
    },
    statNum: {
      color: theme.textPrimary,
      fontSize: 26,
      fontWeight: "800",
    },
    statUnit: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.cardBorder,
      marginVertical: 6,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    sortLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    emptyWrap: {
      paddingVertical: 36,
      alignItems: "center",
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 13,
    },
    yearGroup: {
      marginBottom: 24,
    },
    yearHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 10,
    },
    yearLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    yearLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.cardBorder,
    },
    tripCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 12,
      gap: 14,
    },
    tripThumb: {
      width: 64,
      height: 64,
      borderRadius: 14,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: 6,
    },
    tripThumbInner: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.35,
    },
    tripThumbBadge: {
      backgroundColor: "rgba(0,0,0,0.65)",
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    tripThumbBadgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "800",
    },
    tripBody: { flex: 1, gap: 4 },
    tripTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    tripDate: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    recentBadge: {
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
    tripSub: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    chev: {
      color: theme.textMuted,
      fontSize: 22,
      fontWeight: "400",
    },
  });
}
