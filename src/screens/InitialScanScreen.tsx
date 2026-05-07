import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import type { SuspectTrip } from "../features/photoSync/deviceVerification";
import { resolveDisplayUris } from "../features/photoSync/photoLibrary";
import { runFullSync } from "../features/photoSync/syncService";
import { loadPhotoUrisByIds } from "../features/travel/visitRepository";
import { useVisitStore } from "../features/travel/visitStore";
import { KO_NAME_BY_CODE } from "../lib/countryLookup";
import { useTheme } from "../theme/themeStore";

import { makeStyles } from "./InitialScanScreen/styles";
import SuspectRow from "./InitialScanScreen/SuspectRow";

const PREVIEW_PHOTO_LIMIT = 5;

type Props = { onDone: () => void };

export default function InitialScanScreen({ onDone }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const homeCountry = useVisitStore((s) => s.homeCountry);
  const syncStatus = useVisitStore((s) => s.syncStatus);
  const lastSync = useVisitStore((s) => s.lastSync);
  const setLastSync = useVisitStore((s) => s.setLastSync);
  const suspectTrips = useVisitStore((s) => s.suspectTrips);
  const rejectSuspectTrip = useVisitStore((s) => s.rejectSuspectTrip);
  const acceptSuspectTrip = useVisitStore((s) => s.acceptSuspectTrip);
  const acceptSuspectTrips = useVisitStore((s) => s.acceptSuspectTrips);

  const [started, setStarted] = useState(false);
  const [photoUris, setPhotoUris] = useState<Record<string, string>>({});

  // 의심 여행 목록이 갱신될 때마다 미리보기 5장씩만 일괄 조회.
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

  // 본국이 store에 반영된 직후 자동 시작. OnboardingScreen에서 setHomeCountry가
  // 끝나기 전에 화면이 먼저 마운트될 수 있어 homeCountry를 한 번 더 확인한다.
  useEffect(() => {
    if (started) return;
    if (!homeCountry) return;
    if (syncStatus.running) return;
    if (lastSync) return;
    setStarted(true);
    runFullSync().catch(() => {
      // 실패는 lastSync.error로도 보고되지만 catch가 없으면 unhandled가 되므로 흡수.
    });
  }, [started, homeCountry, syncStatus.running, lastSync]);

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
    onDone();
  };

  const isScanning = syncStatus.running || !lastSync;

  if (isScanning) {
    return (
      <View style={styles.root}>
        <View style={styles.centerWrap}>
          <ActivityIndicator color={theme.accent} size="large" />
          <Text style={styles.loadingTitle}>사진을 살펴보는 중...</Text>
          <Text style={styles.loadingBody}>
            여행 사진을 찾아 기록에 정리하고 있어요.{"\n"}
            잠시만 기다려 주세요.
          </Text>
          {syncStatus.processed > 0 && (
            <Text style={styles.loadingCount}>
              사진 {syncStatus.processed.toLocaleString()}장 확인
            </Text>
          )}
        </View>
      </View>
    );
  }

  // 스캔 종료 후
  const error = lastSync?.error;
  const denied = lastSync?.permission === "denied";

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {error
            ? "사진을 확인하지 못했어요"
            : denied
              ? "사진 접근 권한이 필요해요"
              : suspectTrips.length > 0
                ? "확인이 필요한 여행이에요"
                : "여행 기록 정리가 끝났어요"}
        </Text>
        {!error && !denied && suspectTrips.length > 0 && (
          <Text style={styles.subtitle}>
            다른 기기로 찍힌 사진만 있는 여행이에요. 내 여행이 아닌게 있다면
            기록에서 제거해주세요.
          </Text>
        )}
        {!error && !denied && suspectTrips.length === 0 && (
          <Text style={styles.subtitle}>
            {lastSync && lastSync.added > 0
              ? `사진 ${lastSync.scanned.toLocaleString()}장을 살펴보고 ${lastSync.added.toLocaleString()}장을 여행 기록에 추가했어요.`
              : "확인이 끝났어요. 새로 추가된 여행 기록은 없어요."}
          </Text>
        )}
        {error && (
          <Text style={styles.subtitle}>
            잠시 후 설정에서 다시 스캔할 수 있어요.
          </Text>
        )}
        {denied && (
          <Text style={styles.subtitle}>
            여행 기록을 찾으려면 사진 접근 권한이 필요해요. 설정에서 권한을
            허용한 후 다시 스캔해 주세요.
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!error && !denied && suspectTrips.length > 0 ? (
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
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => void finish()}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {suspectTrips.length > 0 ? "남은 여행은 모두 내 여행" : "시작하기"}
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
