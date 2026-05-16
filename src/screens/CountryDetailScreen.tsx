import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  countPhotosForCountry,
  countPhotosForTrip,
  deleteTrip,
  loadTripsForCountry,
  RecentTrip,
  TripWithPhotos,
} from "../features/travel/visitRepository";
import { useVisitStore } from "../features/travel/visitStore";
import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { getCurrentLocale } from "../i18n";
import { getCountryName } from "../lib/countryName";
import { useTheme } from "../theme/themeStore";
import { flagEmoji } from "../utils/flag";

import EmptyTrips from "./CountryDetailScreen/EmptyTrips";
import HeroCard from "./CountryDetailScreen/HeroCard";
import { makeStyles } from "./CountryDetailScreen/styles";
import TripRow from "./CountryDetailScreen/TripRow";
import { formatMD, groupByYear } from "./CountryDetailScreen/utils";

type Props = {
  onClose: () => void;
  onSelectTrip?: (trip: RecentTrip) => void;
  onMergeTrips?: (countryCode: string) => void;
  onAddTrip?: (country: { code: string; name: string }) => void;
};

export default function CountryDetailScreen({
  onClose,
  onSelectTrip,
  onMergeTrips,
  onAddTrip,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();
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
      t("alerts.tripDeleteTitle"),
      t("alerts.tripDeleteBody", {
        startDate: formatMD(trip.startDate),
        endDate: formatMD(trip.endDate),
        days: trip.days,
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
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
    return <View style={[styles.root, { paddingBottom: bottomInset }]} />;
  }

  const flag = flagEmoji(selectedCountry.code);
  const hasTrips = (trips?.length ?? 0) > 0;
  const countryName = getCountryName(
    selectedCountry.code,
    getCurrentLocale()
  );

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
        <View style={styles.headerCenter}>
          <Text style={styles.headerFlag}>{flag}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {countryName}
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
        <HeroCard
          code={selectedCountry.code}
          name={countryName}
          visits={trips?.length ?? 0}
          days={totalDays}
          photos={photoTotal ?? 0}
        />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>
              {t("countryDetail.sectionTrips")}
            </Text>
            {!editMode && onAddTrip && (
              <Pressable
                onPress={() =>
                  onAddTrip({
                    code: selectedCountry.code,
                    name: countryName,
                  })
                }
                hitSlop={8}
                style={({ pressed }) => [
                  styles.addBtn,
                  pressed && styles.addBtnPressed,
                ]}
              >
                <Text style={styles.addBtnText}>+</Text>
              </Pressable>
            )}
          </View>
          {editMode ? (
            <Text style={styles.editHint}>
              {t("countryDetail.swipeToDelete")}
            </Text>
          ) : (
            <View style={styles.sectionHeaderRight}>
              {(trips?.length ?? 0) >= 2 && onMergeTrips && (
                <Pressable
                  onPress={() => onMergeTrips(selectedCountry.code)}
                  hitSlop={6}
                  style={styles.mergeBtn}
                >
                  <Text style={styles.mergeBtnText}>
                    {t("countryDetail.mergeButton")}
                  </Text>
                </Pressable>
              )}
              <Text style={styles.sortLabel}>
                {t("countryDetail.sortLatest")}
              </Text>
            </View>
          )}
        </View>

        {trips == null ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{t("common.loading")}</Text>
          </View>
        ) : trips.length === 0 ? (
          <EmptyTrips />
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

