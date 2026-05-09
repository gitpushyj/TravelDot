import { useEffect, useMemo, useState } from "react";
import { Pressable, SectionList, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import AddTripActionSheet from "../components/AddTripActionSheet";
import { diffInDays } from "../features/travel/visit/dateUtils";
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
  onMergeHint: (countryCode: string) => void;
  onAddManual: () => void;
  onAddAutoScan: () => void;
};

// 같은 국가의 다른 trip과 4~7일 간격이면 양쪽 trip 모두 hint 대상.
// 자동 병합 임계값(3) 바로 위 + 1주 이내. 화면 진입 시 한 번 계산.
const HINT_MIN = 4;
const HINT_MAX = 7;

function tripKey(trip: TripWithPhotos): string {
  return `${trip.countryCode}|${trip.startDate}|${trip.endDate}`;
}

export default function HistoryScreen({
  onClose,
  onSelectTrip,
  onMergeHint,
  onAddManual,
  onAddAutoScan,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();
  // recentTrips가 바뀌면(여행 추가/삭제 등) 리스트를 다시 불러온다.
  const recentTrips = useVisitStore((s) => s.recentTrips);
  const [trips, setTrips] = useState<TripWithPhotos[] | null>(null);
  const [sort, setSort] = useState<SortKey>("recent");
  const [addSheetOpen, setAddSheetOpen] = useState(false);

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

  // Hint는 화면상 *바로 인접한* 두 같은-국가 trip 사이(gap 4~7)에만 보여야
  // 하므로, sections로 그룹·정렬이 끝난 결과에서 인접 페어를 검사하고 페어의
  // 위쪽(=화면 위) trip 아래에만 mark한다. 이래야 hint가 두 trip "사이"에
  // 위치하고, 페어의 마지막 trip 아래에 어색하게 떠있는 상황도 사라진다.
  // recent 정렬에서만 의미 있다 (다른 정렬은 같은 국가 trip이 인접 보장 안 됨).
  const hintSet = useMemo(() => {
    if (sort !== "recent") return new Set<string>();
    const hints = new Set<string>();
    for (const section of sections) {
      const list = section.data;
      for (let i = 0; i < list.length - 1; i += 1) {
        const a = list[i];
        const b = list[i + 1];
        if (a.countryCode !== b.countryCode) continue;
        const gap = diffInDays(b.endDate, a.startDate);
        if (gap >= HINT_MIN && gap <= HINT_MAX) {
          hints.add(tripKey(a));
        }
      }
    }
    return hints;
  }, [sections, sort]);

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
        <Pressable
          onPress={() => setAddSheetOpen(true)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.iconBtnPressed,
          ]}
        >
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
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
            showMergeHint={hintSet.has(tripKey(item))}
            onPress={() =>
              onSelectTrip({
                countryCode: item.countryCode,
                startDate: item.startDate,
                endDate: item.endDate,
                days: item.days,
              })
            }
            onMergeHintPress={() => onMergeHint(item.countryCode)}
          />
        )}
      />
      <AddTripActionSheet
        visible={addSheetOpen}
        onCancel={() => setAddSheetOpen(false)}
        onManual={() => {
          setAddSheetOpen(false);
          onAddManual();
        }}
        onAutoScan={() => {
          setAddSheetOpen(false);
          onAddAutoScan();
        }}
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
