import { useEffect, useMemo, useState } from "react";
import { Pressable, SectionList, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  loadAllTrips,
  RecentTrip,
  TripWithPhotos,
} from "../features/travel/visitRepository";
import { useVisitStore } from "../features/travel/visitStore";
import { useScreenBottomInset } from "../hooks/useScreenInsets";
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
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();
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

  const sections = useMemo(() => {
    if (!trips) return [];
    const arr = [...trips];
    switch (sort) {
      case "recent": {
        arr.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
        const groups = new Map<string, TripWithPhotos[]>();
        for (const trip of arr) {
          const year = trip.startDate.slice(0, 4);
          const list = groups.get(year);
          if (list) list.push(trip);
          else groups.set(year, [trip]);
        }
        return Array.from(groups, ([year, data]) => ({ year, data }));
      }
      case "days":
        arr.sort((a, b) => b.days - a.days || (a.startDate < b.startDate ? 1 : -1));
        return [{ year: "", data: arr }];
      case "az":
        arr.sort((a, b) => {
          const ak = KO_NAME_BY_CODE[a.countryCode] ?? a.countryCode;
          const bk = KO_NAME_BY_CODE[b.countryCode] ?? b.countryCode;
          const c = ak.localeCompare(bk, "ko");
          if (c !== 0) return c;
          return a.startDate < b.startDate ? 1 : -1;
        });
        return [{ year: "", data: arr }];
    }
  }, [trips, sort]);

  return (
    <View style={[styles.root, { paddingBottom: bottomInset }]}>
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
        <Text style={styles.headerTitle}>{t("history.heading")}</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(t) => `${t.countryCode}-${t.startDate}-${t.endDate}`}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.rowSep} />}
        ListHeaderComponent={
          <>
            <View style={styles.statsCard}>
              <StatCol
                value={totals.countries}
                unit={t("history.statCountriesUnit")}
                theme={theme}
              />
              <View style={styles.statDivider} />
              <StatCol
                value={totals.visits}
                unit={t("history.statVisitsUnit")}
                theme={theme}
              />
              <View style={styles.statDivider} />
              <StatCol
                value={totals.days}
                unit={t("history.statDaysUnit")}
                theme={theme}
              />
            </View>
            <SortTabs theme={theme} value={sort} onChange={setSort} />
          </>
        }
        ListEmptyComponent={
          trips == null ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{t("common.loading")}</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{t("history.empty")}</Text>
            </View>
          )
        }
        renderSectionHeader={({ section }) =>
          section.year ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>
                {t("history.yearHeader", { year: section.year })}
              </Text>
            </View>
          ) : null
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
