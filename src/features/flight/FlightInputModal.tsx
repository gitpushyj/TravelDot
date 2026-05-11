import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";
import type { Theme } from "../../theme/theme";

import AirportPicker from "./AirportPicker";
import type { Airport } from "./airports";
import { estimateFlightMinutes } from "./estimateFlightDuration";
import { useFlightStore } from "./flightStore";
import {
  formatDurationMinutes,
  formatHm,
  hmToEpochAfter,
  hmToEpochToday,
  parseHm,
} from "./timeUtils";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Side = "origin" | "destination" | null;

export default function FlightInputModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const start = useFlightStore((s) => s.start);

  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [pickerSide, setPickerSide] = useState<Side>(null);

  // 시각 입력 텍스트. 모달 열릴 때 기본값을 채워 준다.
  const [departText, setDepartText] = useState("");
  const [arriveText, setArriveText] = useState("");
  // 도착 시각을 사용자가 수동 수정했는지 — 수정했으면 출발지/도착지 변경 시 자동
  // 재계산하지 않는다. 출발지·도착지를 둘 다 다시 바꾸면 false로 리셋된다.
  const [arriveDirty, setArriveDirty] = useState(false);

  // 모달이 열릴 때마다 입력 상태 초기화.
  useEffect(() => {
    if (!visible) return;
    setOrigin(null);
    setDestination(null);
    setPickerSide(null);
    setDepartText(formatHm(Date.now()));
    setArriveText("");
    setArriveDirty(false);
  }, [visible]);

  // 두 공항이 다 선택되고 사용자가 도착 시각을 직접 수정하지 않았다면 자동 계산.
  useEffect(() => {
    if (!origin || !destination) return;
    if (arriveDirty) return;
    const dep = parseHm(departText);
    if (!dep) return;
    const departEpoch = hmToEpochToday(dep.h, dep.m, Date.now());
    const minutes = estimateFlightMinutes(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );
    const arriveEpoch = departEpoch + minutes * 60_000;
    setArriveText(formatHm(arriveEpoch));
  }, [origin, destination, departText, arriveDirty]);

  // 검증: 두 공항 + 시각 둘 다 유효 + 도착>출발이어야 비행 시작 가능.
  const validation = useMemo(() => {
    if (!origin || !destination) return { ok: false as const, minutes: 0 };
    if (origin.iata === destination.iata) return { ok: false as const, minutes: 0 };
    const dep = parseHm(departText);
    const arr = parseHm(arriveText);
    if (!dep || !arr) return { ok: false as const, minutes: 0 };
    const departEpoch = hmToEpochToday(dep.h, dep.m, Date.now());
    const arriveEpoch = hmToEpochAfter(arr.h, arr.m, departEpoch);
    const minutes = Math.round((arriveEpoch - departEpoch) / 60_000);
    if (minutes < 1) return { ok: false as const, minutes: 0 };
    return {
      ok: true as const,
      departEpoch,
      arriveEpoch,
      minutes,
    };
  }, [origin, destination, departText, arriveText]);

  const handleStart = async () => {
    if (!validation.ok || !origin || !destination) return;
    await start(origin, destination, validation.departEpoch, validation.arriveEpoch);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("flight.modalTitle")}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Field
              styles={styles}
              label={t("flight.origin")}
              onPress={() => setPickerSide("origin")}
              empty={origin == null}
              primary={origin ? origin.iata : t("flight.selectAirport")}
              secondary={origin ? `${origin.city} · ${origin.name}` : null}
            />

            <Field
              styles={styles}
              label={t("flight.destination")}
              onPress={() => setPickerSide("destination")}
              empty={destination == null}
              primary={destination ? destination.iata : t("flight.selectAirport")}
              secondary={
                destination ? `${destination.city} · ${destination.name}` : null
              }
            />

            <TimeField
              styles={styles}
              label={t("flight.departTime")}
              value={departText}
              onChange={(v) => {
                setDepartText(v);
                setArriveDirty(false); // 출발 바뀌면 도착 자동 재계산 허용.
              }}
            />

            <TimeField
              styles={styles}
              label={t("flight.arriveTime")}
              value={arriveText}
              onChange={(v) => {
                setArriveText(v);
                setArriveDirty(true);
              }}
              hint={
                validation.ok
                  ? t("flight.arriveHintMinutes", {
                      duration: formatDurationMinutes(validation.minutes),
                    })
                  : t("flight.arriveHintAuto")
              }
            />

            <Pressable
              onPress={handleStart}
              disabled={!validation.ok}
              style={({ pressed }) => [
                styles.startBtn,
                !validation.ok && styles.startBtnDisabled,
                pressed && validation.ok && styles.startBtnPressed,
              ]}
            >
              <Text
                style={[
                  styles.startBtnText,
                  !validation.ok && styles.startBtnTextDisabled,
                ]}
              >
                {t("flight.startBtn")}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>

        <AirportPicker
          visible={pickerSide !== null}
          title={
            pickerSide === "origin"
              ? t("flight.origin")
              : t("flight.destination")
          }
          onSelect={(a) => {
            if (pickerSide === "origin") setOrigin(a);
            if (pickerSide === "destination") setDestination(a);
            setPickerSide(null);
          }}
          onClose={() => setPickerSide(null)}
        />
      </SafeAreaView>
    </Modal>
  );
}

function Field({
  styles,
  label,
  onPress,
  empty,
  primary,
  secondary,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  onPress: () => void;
  empty: boolean;
  primary: string;
  secondary: string | null;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.fieldRow,
          pressed && styles.fieldRowPressed,
        ]}
      >
        <Text
          style={[
            styles.fieldPrimary,
            empty && styles.fieldPrimaryEmpty,
          ]}
        >
          {primary}
        </Text>
        {secondary ? (
          <Text style={styles.fieldSecondary} numberOfLines={1}>
            {secondary}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

function TimeField({
  styles,
  label,
  value,
  onChange,
  hint,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="14:32"
        placeholderTextColor="#888"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        style={styles.timeInput}
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.cardBg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.cardBorder,
    },
    title: { color: theme.textPrimary, fontSize: 18, fontWeight: "700" },
    closeBtn: { padding: 4 },
    closeIcon: { color: theme.textPrimary, fontSize: 18, fontWeight: "700" },
    content: { padding: 16, gap: 4 },
    field: { marginBottom: 16 },
    fieldLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 6,
    },
    fieldRow: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.optionBtnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.cardBorder,
    },
    fieldRowPressed: { backgroundColor: theme.optionBtnPressedBg },
    fieldPrimary: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: 0.4,
    },
    fieldPrimaryEmpty: { color: theme.textSecondary, fontWeight: "500" },
    fieldSecondary: {
      color: theme.textSecondary,
      fontSize: 13,
      marginTop: 4,
    },
    fieldHint: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 6,
    },
    timeInput: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.optionBtnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.cardBorder,
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: "600",
      letterSpacing: 0.4,
    },
    startBtn: {
      marginTop: 8,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: theme.textPrimary,
      alignItems: "center",
    },
    startBtnPressed: { opacity: 0.85 },
    startBtnDisabled: { backgroundColor: theme.optionBtnPressedBg },
    startBtnText: {
      color: theme.cardBg,
      fontSize: 16,
      fontWeight: "700",
    },
    startBtnTextDisabled: { color: theme.textSecondary },
  });
}
