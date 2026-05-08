import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  countPhotosForTrip,
  loadTripsForCountry,
  mergeTrips,
  type RecentTrip,
  type TripWithPhotos,
} from "../features/travel/visitRepository";
import { useVisitStore } from "../features/travel/visitStore";
import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { getCurrentLocale } from "../i18n";
import { getCountryName } from "../lib/countryName";
import { useTheme } from "../theme/themeStore";

import GapDivider from "./CountryMergeScreen/GapDivider";
import TripCheckRow from "./CountryMergeScreen/TripCheckRow";
import { makeStyles } from "./CountryMergeScreen/styles";
import {
  containsNonAdjacentGap,
  gapBetween,
  maxGapDays,
} from "./CountryMergeScreen/utils";

// 자동 병합 임계값과 동일하게 둔다. 변경 시 syncService의 인자도 같이.
const ADJACENT_THRESHOLD = 3;

type Props = { countryCode: string; onClose: () => void };

type ListItem =
  | { kind: "trip"; trip: TripWithPhotos }
  | { kind: "gap"; days: number; key: string };

function tripKey(trip: RecentTrip): string {
  return `${trip.countryCode}|${trip.startDate}|${trip.endDate}`;
}

export default function CountryMergeScreen({ countryCode, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();
  const refreshVisits = useVisitStore((s) => s.refreshVisits);

  const [trips, setTrips] = useState<TripWithPhotos[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const reload = async () => {
    const raw = await loadTripsForCountry(countryCode);
    const counts = await Promise.all(
      raw.map((tr) =>
        countPhotosForTrip(tr.countryCode, tr.startDate, tr.endDate)
      )
    );
    setTrips(raw.map((tr, i) => ({ ...tr, photos: counts[i] })));
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = await loadTripsForCountry(countryCode);
      const counts = await Promise.all(
        raw.map((tr) =>
          countPhotosForTrip(tr.countryCode, tr.startDate, tr.endDate)
        )
      );
      if (cancelled) return;
      setTrips(raw.map((tr, i) => ({ ...tr, photos: counts[i] })));
    })();
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  // loadTripsForCountry는 startDate DESC. 위 trip이 더 늦은 trip, 아래가 더 이른 trip.
  // gap은 (아래 trip의 endDate)와 (위 trip의 startDate) 사이로 계산.
  const items: ListItem[] = useMemo(() => {
    if (!trips) return [];
    const out: ListItem[] = [];
    for (let i = 0; i < trips.length; i += 1) {
      out.push({ kind: "trip", trip: trips[i] });
      if (i < trips.length - 1) {
        const upper = trips[i];
        const lower = trips[i + 1];
        const gap = gapBetween(lower.endDate, upper.startDate);
        if (gap > ADJACENT_THRESHOLD) {
          out.push({ kind: "gap", days: gap, key: `gap-${i}` });
        }
      }
    }
    return out;
  }, [trips]);

  const selectedTrips = useMemo<TripWithPhotos[]>(() => {
    if (!trips) return [];
    return trips.filter((tr) => selected.has(tripKey(tr)));
  }, [trips, selected]);

  const toggle = (trip: RecentTrip) => {
    const k = tripKey(trip);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const canMerge = selectedTrips.length >= 2;

  const performMerge = async () => {
    if (selectedTrips.length < 2) return;
    const sorted = [...selectedTrips].sort((a, b) =>
      a.startDate < b.startDate ? -1 : 1
    );
    const start = sorted[0].startDate;
    const end = sorted[sorted.length - 1].endDate;
    await mergeTrips(countryCode, start, end);
    setSelected(new Set());
    await reload();
    await refreshVisits();
  };

  const onMerge = () => {
    if (containsNonAdjacentGap(selectedTrips, ADJACENT_THRESHOLD)) {
      const days = maxGapDays(selectedTrips);
      Alert.alert(
        t("merge.confirmGapTitle"),
        t("merge.confirmGapBody", { days }),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("merge.actionMerge"), onPress: () => void performMerge() },
        ]
      );
      return;
    }
    void performMerge();
  };

  const countryName = getCountryName(countryCode, getCurrentLocale());

  return (
    <View style={[styles.root, { paddingBottom: bottomInset }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.iconBtn}>
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t("merge.title", { country: countryName })}
        </Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <Text style={styles.subtitle}>{t("merge.subtitle")}</Text>

      {trips == null ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t("common.loading")}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) =>
            it.kind === "trip" ? tripKey(it.trip) : it.key
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.rowSep} />}
          renderItem={({ item }) => {
            if (item.kind === "gap") {
              return <GapDivider theme={theme} days={item.days} />;
            }
            return (
              <TripCheckRow
                theme={theme}
                trip={item.trip}
                selected={selected.has(tripKey(item.trip))}
                onToggle={() => toggle(item.trip)}
              />
            );
          }}
        />
      )}

      <View style={styles.bottomBar}>
        <Text style={styles.selectedCount}>
          {t("merge.selectedCount", { count: selectedTrips.length })}
        </Text>
        <Pressable
          disabled={!canMerge}
          onPress={onMerge}
          style={[styles.mergeBtn, !canMerge && styles.mergeBtnDisabled]}
        >
          <Text style={styles.mergeBtnText}>{t("merge.actionMerge")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
