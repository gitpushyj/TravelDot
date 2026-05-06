import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

import { runFullSync } from "../features/photoSync/syncService";
import { SuspectTrip } from "../features/photoSync/deviceVerification";
import { useVisitStore } from "../features/travel/visitStore";
import { loadPhotoUrisByIds } from "../features/travel/visitRepository";
import { resolveDisplayUris } from "../features/photoSync/photoLibrary";
import { flagEmoji } from "../utils/flag";
import { colorForCountry } from "../utils/countryColors";
import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";
import countriesJson from "../../assets/data/countries.json";

type CountryEntry = { code: string; name: string; nameKo: string };
const COUNTRY_LIST = countriesJson as CountryEntry[];
const KO_NAME_BY_CODE: Record<string, string> = {};
for (const c of COUNTRY_LIST) KO_NAME_BY_CODE[c.code] = c.nameKo;

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
          <View style={styles.list}>
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
          </View>
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

function SuspectRow({
  theme,
  trip,
  previewUris,
  onReject,
  onAccept,
}: {
  theme: Theme;
  trip: SuspectTrip;
  previewUris: string[];
  onReject: () => void;
  onAccept: () => void;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const koName = KO_NAME_BY_CODE[trip.countryCode] ?? trip.countryCode;
  const deviceText =
    trip.deviceLabels.length === 0
      ? "다른 기기"
      : trip.deviceLabels.length === 1
        ? trip.deviceLabels[0]
        : `${trip.deviceLabels[0]} 외 ${trip.deviceLabels.length - 1}대`;
  const remainingPhotos = Math.max(0, trip.photoCount - previewUris.length);

  const countryColor = colorForCountry(trip.countryCode);

  return (
    <Animated.View
      style={styles.row}
      exiting={FadeOut.duration(220)}
      layout={LinearTransition.duration(220)}
    >
      <View style={styles.rowMain}>
        <View style={[styles.flagBox, { backgroundColor: countryColor.bg }]}>
          <Text style={styles.flagText}>{flagEmoji(trip.countryCode)}</Text>
        </View>
        <View style={styles.rowText}>
          <View style={styles.rowTitleLine}>
            <Text style={styles.rowName}>{koName}</Text>
            <Text style={styles.rowCode}> {trip.countryCode}</Text>
          </View>
          <Text style={styles.rowDate}>
            {formatRange(trip.startDate, trip.endDate)} · {trip.days}일
          </Text>
          <Text style={styles.rowMeta}>
            사진 {trip.photoCount}장 · {deviceText}
          </Text>
        </View>
      </View>
      {previewUris.length > 0 && (
        <View style={styles.thumbRow}>
          {previewUris.map((uri, idx) => (
            <View key={`${uri}-${idx}`} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              {idx === previewUris.length - 1 && remainingPhotos > 0 && (
                <View style={styles.thumbOverlay}>
                  <Text style={styles.thumbOverlayText}>
                    +{remainingPhotos}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
      <View style={styles.actionRow}>
        <Pressable
          onPress={onReject}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.rejectBtn,
            pressed && styles.actionBtnPressed,
          ]}
        >
          <Text style={styles.rejectBtnIcon}>✕</Text>
          <Text style={styles.rejectBtnText}>제거</Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.acceptBtn,
            pressed && styles.actionBtnPressed,
          ]}
        >
          <Text style={styles.acceptBtnText}>내 여행에 추가</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function formatRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return startDate;
  return `${startDate} ~ ${endDate}`;
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 56,
    },
    centerWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 16,
    },
    loadingTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
      marginTop: 8,
    },
    loadingBody: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
    },
    loadingCount: {
      color: theme.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 8,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 140,
    },
    list: {
      gap: 12,
    },
    row: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 14,
    },
    rowMain: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    rowText: { flex: 1 },
    rowTitleLine: {
      flexDirection: "row",
      alignItems: "center",
    },
    rowName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    rowCode: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    rowDate: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 4,
    },
    rowMeta: {
      color: theme.textMuted,
      fontSize: 11,
      marginTop: 4,
    },
    flagBox: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: theme.flagBoxBg,
      alignItems: "center",
      justifyContent: "center",
    },
    flagText: { fontSize: 26 },
    thumbRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 12,
    },
    thumbWrap: {
      width: 60,
      height: 60,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: theme.flagBoxBg,
    },
    thumb: { width: "100%", height: "100%" },
    thumbOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
    },
    thumbOverlayText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
    actionRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      gap: 6,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    actionBtnPressed: {
      opacity: 0.7,
    },
    rejectBtn: {
      backgroundColor: theme.tabRowBg,
    },
    rejectBtnIcon: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 16,
    },
    rejectBtnText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    acceptBtn: {
      backgroundColor: theme.accent,
    },
    acceptBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 36,
      backgroundColor: theme.homeBg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.cardBorder,
    },
    primaryBtn: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    primaryBtnText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },
  });
}
