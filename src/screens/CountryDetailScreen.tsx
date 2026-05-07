import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import {
  countPhotosForCountry,
  countPhotosForTrip,
  deleteTrip,
  loadTripsForCountry,
  RecentTrip,
  TripWithPhotos,
} from "../features/travel/visitRepository";
import { useVisitStore } from "../features/travel/visitStore";
import { useTheme } from "../theme/themeStore";
import { flagEmoji } from "../utils/flag";

import { makeStyles } from "./CountryDetailScreen/styles";
import TripRow from "./CountryDetailScreen/TripRow";
import { formatMD, groupByYear } from "./CountryDetailScreen/utils";

type Props = {
  onClose: () => void;
  onSelectTrip?: (trip: RecentTrip) => void;
};

export default function CountryDetailScreen({ onClose, onSelectTrip }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const selectedCountry = useVisitStore((s) => s.selectedCountry);
  const refreshVisits = useVisitStore((s) => s.refreshVisits);

  const [trips, setTrips] = useState<TripWithPhotos[] | null>(null);
  const [photoTotal, setPhotoTotal] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);

  const reload = async (code: string) => {
    const rawTrips = await loadTripsForCountry(code);
    const total = await countPhotosForCountry(code);
    const counts = await Promise.all(
      rawTrips.map((t) => countPhotosForTrip(t.countryCode, t.startDate, t.endDate))
    );
    setTrips(rawTrips.map((t, i) => ({ ...t, photos: counts[i] })));
    setPhotoTotal(total);
  };

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

  const handleDelete = (trip: TripWithPhotos) => {
    if (!selectedCountry) return;
    const code = selectedCountry.code;
    Alert.alert(
      "여행 기록 삭제",
      `${formatMD(trip.startDate)} — ${formatMD(trip.endDate)} (${trip.days}일) 기록을 삭제할까요?\n해당 기간의 사진/메모도 함께 사라집니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            await deleteTrip(code, trip.startDate, trip.endDate);
            await reload(code);
            await refreshVisits();
          },
        },
      ]
    );
  };

  if (!selectedCountry) {
    return <View style={styles.root} />;
  }

  const flag = flagEmoji(selectedCountry.code);
  const hasTrips = (trips?.length ?? 0) > 0;

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
        <Pressable
          onPress={() => setEditMode((v) => !v)}
          disabled={!hasTrips && !editMode}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconBtn,
            editMode && styles.iconBtnActive,
            pressed && styles.iconBtnPressed,
            !hasTrips && !editMode && styles.iconBtnDisabled,
          ]}
        >
          <Text
            style={[
              styles.iconBtnText,
              styles.editIcon,
              editMode && styles.iconBtnTextActive,
            ]}
          >
            {editMode ? "✓" : "✎"}
          </Text>
        </Pressable>
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
          {editMode ? (
            <Text style={styles.editHint}>← 옆으로 밀어 삭제</Text>
          ) : (
            <Text style={styles.sortLabel}>최신순</Text>
          )}
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
                    editMode={editMode}
                    onPress={() => onSelectTrip?.(trip)}
                    onDelete={() => handleDelete(trip)}
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
