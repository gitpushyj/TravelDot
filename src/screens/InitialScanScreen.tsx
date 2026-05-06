import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { runFullSync } from "../features/photoSync/syncService";
import { SuspectTrip } from "../features/photoSync/deviceVerification";
import { useVisitStore } from "../features/travel/visitStore";
import { flagEmoji } from "../utils/flag";
import { colorForCountry } from "../utils/countryColors";
import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";
import countriesJson from "../../assets/data/countries.json";

type CountryEntry = { code: string; name: string; nameKo: string };
const COUNTRY_LIST = countriesJson as CountryEntry[];
const KO_NAME_BY_CODE: Record<string, string> = {};
for (const c of COUNTRY_LIST) KO_NAME_BY_CODE[c.code] = c.nameKo;

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
  const acceptSuspectTrips = useVisitStore((s) => s.acceptSuspectTrips);

  const [started, setStarted] = useState(false);

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
            다른 기기로 찍힌 사진만 있는 여행이에요. 친구한테 받은 사진이라면
            기록에서 빼주세요.
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
            {suspectTrips.map((trip) => (
              <SuspectRow
                key={`${trip.countryCode}-${trip.startDate}-${trip.endDate}`}
                theme={theme}
                trip={trip}
                onReject={() => handleReject(trip)}
              />
            ))}
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
  onReject,
}: {
  theme: Theme;
  trip: SuspectTrip;
  onReject: () => void;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const koName = KO_NAME_BY_CODE[trip.countryCode] ?? trip.countryCode;
  const deviceText =
    trip.deviceLabels.length === 0
      ? "다른 기기"
      : trip.deviceLabels.length === 1
        ? trip.deviceLabels[0]
        : `${trip.deviceLabels[0]} 외 ${trip.deviceLabels.length - 1}대`;

  const countryColor = colorForCountry(trip.countryCode);

  return (
    <View style={styles.row}>
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
      <Pressable
        onPress={onReject}
        style={({ pressed }) => [
          styles.rejectBtn,
          pressed && styles.rejectBtnPressed,
        ]}
      >
        <Text style={styles.rejectBtnText}>내 여행 아님</Text>
      </Pressable>
    </View>
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
      paddingBottom: 100,
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
    rejectBtn: {
      marginTop: 12,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: theme.tabRowBg,
    },
    rejectBtnPressed: {
      opacity: 0.7,
    },
    rejectBtnText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      padding: 16,
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
