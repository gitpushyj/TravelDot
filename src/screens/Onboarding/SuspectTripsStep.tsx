import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { LinearTransition } from "react-native-reanimated";

import type { SuspectTrip } from "../../features/photoSync/deviceVerification";
import { resolveDisplayUris } from "../../features/photoSync/photoLibrary";
import { loadPhotoUrisByIds } from "../../features/travel/visitRepository";
import { useVisitStore } from "../../features/travel/visitStore";
import { KO_NAME_BY_CODE } from "../../lib/countryLookup";
import SuspectRow from "../InitialScanScreen/SuspectRow";
import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";

const PREVIEW_PHOTO_LIMIT = 5;

type Props = { onFinish: () => void };

export default function SuspectTripsStep({ onFinish }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);

  const suspectTrips = useVisitStore((s) => s.suspectTrips);
  const rejectSuspectTrip = useVisitStore((s) => s.rejectSuspectTrip);
  const acceptSuspectTrip = useVisitStore((s) => s.acceptSuspectTrip);
  const acceptSuspectTrips = useVisitStore((s) => s.acceptSuspectTrips);
  const setLastSync = useVisitStore((s) => s.setLastSync);

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
        const entries = Object.entries(stored).map(([id, uri]) => ({ id, uri }));
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
    const koName = KO_NAME_BY_CODE[trip.countryCode] ?? trip.countryCode;
    Alert.alert(
      "내 여행 아님",
      `${koName} ${formatRange(trip.startDate, trip.endDate)} 여행을 기록에서 제거할까요?\n사진 ${trip.photoCount}장이 함께 정리됩니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "제거",
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

  const finish = async () => {
    if (suspectTrips.length > 0) {
      await acceptSuspectTrips(suspectTrips);
    }
    setLastSync(null);
    onFinish();
  };

  if (suspectTrips.length === 0) {
    return (
      <>
        <View style={styles.centerWrap}>
          <Text style={styles.centerTitle}>
            {t("onboarding.suspect.allClearedTitle")}
          </Text>
          <Text style={styles.centerBody}>
            {t("onboarding.suspect.allClearedBody")}
          </Text>
        </View>
        <View style={styles.footer}>
          <Pressable
            onPress={() => void finish()}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {t("onboarding.suspect.goHome")}
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.bodyHeader}>
        <Text style={styles.title}>{t("onboarding.suspect.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.suspect.subtitle")}</Text>
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
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          onPress={() => void finish()}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {t("onboarding.suspect.acceptAll")}
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
