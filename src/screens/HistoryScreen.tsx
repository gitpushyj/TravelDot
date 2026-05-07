import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

import {
  loadAllTrips,
  RecentTrip,
  TripWithPhotos,
} from "../features/travel/visitRepository";
import { useVisitStore } from "../features/travel/visitStore";
import { KO_NAME_BY_CODE } from "../lib/countryLookup";
import type { Theme } from "../theme/theme";
import { useTheme } from "../theme/themeStore";

import SortTabs, { type SortKey } from "./HistoryScreen/SortTabs";
import { makeStyles } from "./HistoryScreen/styles";
import TripRow from "./HistoryScreen/TripRow";

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
