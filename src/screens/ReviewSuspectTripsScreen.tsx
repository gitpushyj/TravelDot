import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import type { SuspectTrip } from "../features/photoSync/deviceVerification";
import { resolveDisplayUris } from "../features/photoSync/photoLibrary";
import { loadPhotoUrisByIds } from "../features/travel/visitRepository";
import { useVisitStore } from "../features/travel/visitStore";
import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { getCurrentLocale } from "../i18n";
import { getCountryName } from "../lib/countryName";
import { useTheme } from "../theme/themeStore";

import { makeStyles } from "./ReviewSuspectTripsScreen/styles";
import SuspectRow from "./ReviewSuspectTripsScreen/SuspectRow";

const PREVIEW_PHOTO_LIMIT = 5;

type Props = { onClose: () => void };

export default function ReviewSuspectTripsScreen({ onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();
  const suspectTrips = useVisitStore((s) => s.suspectTrips);
  const rejectSuspectTrip = useVisitStore((s) => s.rejectSuspectTrip);
  const acceptSuspectTrip = useVisitStore((s) => s.acceptSuspectTrip);
  const acceptSuspectTrips = useVisitStore((s) => s.acceptSuspectTrips);

  // 모든 의심 여행의 미리보기 사진을 한 번에 로드. trip별로 photoIds 앞쪽 N개만
  // 보여주면 충분하므로, 평탄화된 id 묶음으로 단일 쿼리를 던진다.
  const [photoUris, setPhotoUris] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const ids: string[] = [];
    for (const trip of suspectTrips) {
      ids.push(...trip.photoIds.slice(0, PREVIEW_PHOTO_LIMIT));
    }
    if (ids.length === 0) {
      setPhotoUris({});
      return;
    }
    void (async () => {
      try {
        const stored = await loadPhotoUrisByIds(ids);
        const entries = Object.entries(stored).map(([id, uri]) => ({
          id,
          uri,
        }));
        const display = await resolveDisplayUris(entries);
        if (!cancelled) setPhotoUris(display);
      } catch {
        if (!cancelled) setPhotoUris({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [suspectTrips]);

  const handleReject = (trip: SuspectTrip) => {
    const koName = getCountryName(trip.countryCode, getCurrentLocale());
    Alert.alert(
      t("alerts.notMyTripTitle"),
      t("alerts.notMyTripBody", {
        country: koName,
        range: formatRange(trip.startDate, trip.endDate),
        count: trip.photoCount,
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.remove"),
          style: "destructive",
          onPress: () => {
            void rejectSuspectTrip(trip);
          },
        },
      ]
    );
  };

  const handleAccept = (trip: SuspectTrip) => {
    void acceptSuspectTrip(trip);
  };

  const handleConfirmAll = async () => {
    if (suspectTrips.length === 0) {
      onClose();
      return;
    }
    await acceptSuspectTrips(suspectTrips);
    onClose();
  };

  return (
    <View style={[styles.root, { paddingBottom: bottomInset }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.cancel}>{t("common.close")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("reviewSuspect.heading")}</Text>
        <View style={{ minWidth: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            {t("reviewSuspect.introTitle")}
          </Text>
          <Text style={styles.introBody}>
            {t("reviewSuspect.introBody")}
          </Text>
        </View>

        {suspectTrips.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {t("reviewSuspect.noneTitle")}
            </Text>
          </View>
        ) : (
          <Animated.View
            style={styles.list}
            layout={LinearTransition.duration(260)}
          >
            {suspectTrips.map((trip) => {
              const previewUris = trip.photoIds
                .slice(0, PREVIEW_PHOTO_LIMIT)
                .map((id) => photoUris[id])
                .filter((u): u is string => !!u);
              return (
                <SuspectRow
                  key={`${trip.countryCode}-${trip.startDate}-${trip.endDate}`}
                  theme={theme}
                  trip={trip}
                  previewUris={previewUris}
                  onReject={() => handleReject(trip)}
                  onAccept={() => handleAccept(trip)}
                />
              );
            })}
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => void handleConfirmAll()}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {suspectTrips.length === 0
              ? t("reviewSuspect.primaryConfirm")
              : t("reviewSuspect.primaryAcceptAll")}
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
