import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  loadAllTrips,
  RecentTrip,
  TripWithPhotos,
} from "../features/travel/visitRepository";
import { useVisitStore } from "../features/travel/visitStore";
import { flagEmoji } from "../utils/flag";
import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";
import countriesJson from "../../assets/data/countries.json";

type CountryEntry = { code: string; name: string; nameKo: string };
const COUNTRY_LIST = countriesJson as CountryEntry[];
const KO_NAME_BY_CODE: Record<string, string> = {};
for (const c of COUNTRY_LIST) KO_NAME_BY_CODE[c.code] = c.nameKo;

type SortKey = "recent" | "days" | "az";

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "최근순" },
  { key: "days", label: "체류일순" },
  { key: "az", label: "A-Z" },
];

type Props = {
  onClose: () => void;
  onSelectTrip: (trip: RecentTrip) => void;
};

export default function HistoryScreen({ onClose, onSelectTrip }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // recentTrips가 바뀌면(여행 추가/삭제 등) 리스트를 다시 불러온다.
  const recentTrips = useVisitStore((s) => s.recentTrips);
  const [trips, setTrips] = useState<TripWithPhotos[] | null>(null);
  const [sort, setSort] = useState<SortKey>("recent");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const all = await loadAllTrips();
      if (!cancelled) setTrips(all);
    })();
    return () => {
      cancelled = true;
    };
  }, [recentTrips]);

  const totals = useMemo(() => {
    if (!trips) return { countries: 0, visits: 0, days: 0 };
    const codes = new Set<string>();
    let days = 0;
    for (const t of trips) {
      codes.add(t.countryCode);
      days += t.days;
    }
    return { countries: codes.size, visits: trips.length, days };
  }, [trips]);

  const sorted = useMemo(() => {
    if (!trips) return [];
    const arr = [...trips];
    switch (sort) {
      case "recent":
        arr.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
        break;
      case "days":
        arr.sort((a, b) => b.days - a.days || (a.startDate < b.startDate ? 1 : -1));
        break;
      case "az":
        arr.sort((a, b) => {
          const ak = KO_NAME_BY_CODE[a.countryCode] ?? a.countryCode;
          const bk = KO_NAME_BY_CODE[b.countryCode] ?? b.countryCode;
          const c = ak.localeCompare(bk, "ko");
          if (c !== 0) return c;
          return a.startDate < b.startDate ? 1 : -1;
        });
        break;
    }
    return arr;
  }, [trips, sort]);

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
        <Text style={styles.headerTitle}>여행 기록</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(t) => `${t.countryCode}-${t.startDate}-${t.endDate}`}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.rowSep} />}
        ListHeaderComponent={
          <>
            <View style={styles.statsCard}>
              <StatCol value={totals.countries} unit="개국" theme={theme} />
              <View style={styles.statDivider} />
              <StatCol value={totals.visits} unit="회 방문" theme={theme} />
              <View style={styles.statDivider} />
              <StatCol value={totals.days} unit="일 누적" theme={theme} />
            </View>
            <SortTabs theme={theme} value={sort} onChange={setSort} />
          </>
        }
        ListEmptyComponent={
          trips == null ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>불러오는 중…</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                아직 기록된 여행이 없어요.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TripRow
            theme={theme}
            trip={item}
            onPress={() =>
              onSelectTrip({
                countryCode: item.countryCode,
                startDate: item.startDate,
                endDate: item.endDate,
                days: item.days,
              })
            }
          />
        )}
      />
    </View>
  );
}

function StatCol({
  value,
  unit,
  theme,
}: {
  value: number;
  unit: string;
  theme: Theme;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.statCol}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

function SortTabs({
  theme,
  value,
  onChange,
}: {
  theme: Theme;
  value: SortKey;
  onChange: (s: SortKey) => void;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.sortRow}>
      {SORT_TABS.map((t) => {
        const active = t.key === value;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={({ pressed }) => [
              styles.sortChip,
              active && styles.sortChipActive,
              pressed && !active && styles.sortChipPressed,
            ]}
          >
            <Text
              style={[
                styles.sortChipText,
                active && styles.sortChipTextActive,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TripRow({
  theme,
  trip,
  onPress,
}: {
  theme: Theme;
  trip: TripWithPhotos;
  onPress: () => void;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const koName = KO_NAME_BY_CODE[trip.countryCode] ?? trip.countryCode;
  const [y, m, d] = trip.startDate.split("-");
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: theme.rowPressedBg },
      ]}
    >
      <View style={styles.flagBox}>
        <Text style={styles.flagText}>{flagEmoji(trip.countryCode)}</Text>
      </View>
      <View style={styles.rowMain}>
        <View style={styles.titleRow}>
          <Text style={styles.rowName}>{koName}</Text>
          <Text style={styles.rowCode}> {trip.countryCode}</Text>
        </View>
        <Text style={styles.rowSub}>
          {trip.days}일 · {trip.photos}장
        </Text>
      </View>
      <Text style={styles.rowDate}>
        {y} · {m} · {d}
      </Text>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
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
    iconBtnPlaceholder: { width: 40, height: 40 },
    iconBtnText: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "600",
      lineHeight: 24,
    },
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    listContent: {
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
      marginHorizontal: 20,
      marginTop: 8,
      marginBottom: 16,
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
    sortRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    sortChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "transparent",
    },
    sortChipPressed: {
      backgroundColor: theme.tabRowBg,
    },
    sortChipActive: {
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    sortChipText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "700",
    },
    sortChipTextActive: {
      color: theme.textPrimary,
    },
    rowSep: { height: 1, backgroundColor: theme.cardBorder, marginLeft: 20 },
    row: {
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
    rowMain: { flex: 1 },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    rowName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    rowCode: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    rowSub: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    rowDate: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
      marginRight: 4,
    },
    chev: {
      color: theme.textMuted,
      fontSize: 22,
      fontWeight: "400",
    },
    emptyWrap: {
      paddingHorizontal: 20,
      paddingVertical: 36,
      alignItems: "center",
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 13,
      textAlign: "center",
    },
  });
}
