import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SuspectTrip } from "../features/photoSync/deviceVerification";
import { useVisitStore } from "../features/travel/visitStore";
import { flagEmoji } from "../utils/flag";
import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";
import countriesJson from "../../assets/data/countries.json";

type CountryEntry = { code: string; name: string; nameKo: string };
const COUNTRY_LIST = countriesJson as CountryEntry[];
const KO_NAME_BY_CODE: Record<string, string> = {};
for (const c of COUNTRY_LIST) KO_NAME_BY_CODE[c.code] = c.nameKo;

type Props = { onClose: () => void };

export default function ReviewSuspectTripsScreen({ onClose }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const suspectTrips = useVisitStore((s) => s.suspectTrips);
  const rejectSuspectTrip = useVisitStore((s) => s.rejectSuspectTrip);
  const acceptSuspectTrips = useVisitStore((s) => s.acceptSuspectTrips);

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

  const handleConfirmAll = async () => {
    if (suspectTrips.length === 0) {
      onClose();
      return;
    }
    await acceptSuspectTrips(suspectTrips);
    onClose();
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.cancel}>닫기</Text>
        </Pressable>
        <Text style={styles.title}>여행 확인하기</Text>
        <View style={{ minWidth: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            다른 기기로 찍힌 사진만 있는 여행이에요
          </Text>
          <Text style={styles.introBody}>
            친구한테서 받은 사진처럼, 본인이 다녀온 여행이 아닌 사진이 섞여
            있을 수 있어요. 본인 여행이 아닌 건 제거해 주세요.
          </Text>
        </View>

        {suspectTrips.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              확인이 필요한 여행이 없어요.
            </Text>
          </View>
        ) : (
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
              ? "확인"
              : "남은 여행은 모두 내 여행"}
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

  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <View style={styles.flagBox}>
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
    cancel: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: "600",
      minWidth: 40,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 100,
    },
    intro: {
      marginBottom: 16,
    },
    introTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 6,
    },
    introBody: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
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
    emptyWrap: {
      paddingVertical: 32,
      alignItems: "center",
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 13,
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
