import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { LinearTransition } from "react-native-reanimated";

import { resolveDisplayUris } from "../../features/photoSync/photoLibrary";
import {
  loadAllTrips,
  loadPhotosForTrip,
  TripWithPhotos,
} from "../../features/travel/visitRepository";
import { useVisitStore } from "../../features/travel/visitStore";
import { getCurrentLocale } from "../../i18n";
import { getCountryName } from "../../lib/countryName";
import { useTheme } from "../../theme/themeStore";

import AllTripRow from "./AllTripRow";
import { makeOnboardingStyles } from "./styles";

const PREVIEW_PHOTO_LIMIT = 5;

type Props = { onFinish: () => void };

type TripKey = string;
function keyOf(t: { countryCode: string; startDate: string; endDate: string }): TripKey {
  return `${t.countryCode}|${t.startDate}|${t.endDate}`;
}

export default function AllTripsStep({ onFinish }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);

  const rejectTrip = useVisitStore((s) => s.rejectTrip);
  const setLastSync = useVisitStore((s) => s.setLastSync);

  const [trips, setTrips] = useState<TripWithPhotos[] | null>(null);
  const [previews, setPreviews] = useState<Record<TripKey, string[]>>({});

  // sync 종료 후 1회만 trip 리스트를 로드. 사용자가 reject하면 visitStore의
  // refreshVisits가 다시 데이터를 갱신하지만, 이 화면은 로컬 state로 trip을
  // 직접 들고 있으면서 reject된 trip만 제거한다 (애니메이션을 위해서).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await loadAllTrips();
      if (!cancelled) setTrips(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 모든 trip에 대해 처음 N장 미리보기를 한 번에 로드.
  // 50 trip × 5장 = 250 사진까지는 한 번에 resolve해도 부담 없음.
  useEffect(() => {
    if (!trips) return;
    let cancelled = false;
    void (async () => {
      const next: Record<TripKey, string[]> = {};
      for (const trip of trips) {
        const photos = await loadPhotosForTrip(
          trip.countryCode,
          trip.startDate,
          trip.endDate
        );
        const slice = photos.slice(0, PREVIEW_PHOTO_LIMIT);
        const entries = slice.map((p) => ({ id: p.id, uri: p.localUri }));
        const resolved = await resolveDisplayUris(entries);
        next[keyOf(trip)] = slice
          .map((p) => resolved[p.id])
          .filter((u): u is string => !!u);
        if (cancelled) return;
      }
      if (!cancelled) setPreviews(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [trips]);

  const handleReject = (trip: TripWithPhotos) => {
    const name = getCountryName(trip.countryCode, getCurrentLocale());
    Alert.alert(
      t("alerts.notMyTripTitle"),
      t("alerts.notMyTripBody", {
        country: name,
        range: formatRange(trip.startDate, trip.endDate),
        count: trip.photos,
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.remove"),
          style: "destructive",
          onPress: () => {
            void (async () => {
              await rejectTrip({
                countryCode: trip.countryCode,
                startDate: trip.startDate,
                endDate: trip.endDate,
              });
              setTrips((prev) =>
                prev ? prev.filter((p) => keyOf(p) !== keyOf(trip)) : prev
              );
            })();
          },
        },
      ]
    );
  };

  const finish = () => {
    setLastSync(null);
    onFinish();
  };

  if (trips == null) {
    // 첫 로딩 동안에는 빈 화면을 보여준다 (sync가 끝났으니 보통 매우 짧음).
    return <View style={{ flex: 1 }} />;
  }

  if (trips.length === 0) {
    return (
      <>
        <View style={styles.centerWrap}>
          <Text style={styles.centerTitle}>
            {t("onboarding.allTrips.emptyTitle")}
          </Text>
          <Text style={styles.centerBody}>
            {t("onboarding.allTrips.emptyBody")}
          </Text>
        </View>
        <View style={styles.footer}>
          <Pressable
            onPress={finish}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {t("onboarding.allTrips.goHome")}
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.bodyHeader}>
        <Text style={styles.title}>{t("onboarding.allTrips.title")}</Text>
        <Text style={styles.subtitle}>
          {t("onboarding.allTrips.subtitle", { count: trips.length })}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
          gap: 12,
        }}
      >
        <Animated.View
          style={{ gap: 12 }}
          layout={LinearTransition.duration(260)}
        >
          {trips.map((trip) => (
            <AllTripRow
              key={keyOf(trip)}
              theme={theme}
              countryCode={trip.countryCode}
              startDate={trip.startDate}
              endDate={trip.endDate}
              days={trip.days}
              photoCount={trip.photos}
              previewUris={previews[keyOf(trip)] ?? []}
              onReject={() => handleReject(trip)}
            />
          ))}
        </Animated.View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          onPress={finish}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {t("onboarding.allTrips.confirmAll")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return startDate;
  return `${startDate} ~ ${endDate}`;
}
