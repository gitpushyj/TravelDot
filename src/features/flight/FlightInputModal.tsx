import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";
import type { Theme } from "../../theme/theme";

import AirportPicker from "./AirportPicker";
import type { Airport } from "./airports";
import DurationPickerSheet from "./DurationPickerSheet";
import { estimateFlightMinutes } from "./estimateFlightDuration";
import { useFlightStore } from "./flightStore";

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
  const [durationOpen, setDurationOpen] = useState(false);

  // 비행 시간 (시/분). 두 공항 선택 시 자동 추정값으로 채우고, 사용자가 한 번이라도
  // 직접 휠을 돌리면 dirty가 true가 되어 그 뒤부터는 자동 재계산하지 않는다.
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [durationDirty, setDurationDirty] = useState(false);

  // 모달이 열릴 때마다 입력 상태 초기화.
  useEffect(() => {
    if (!visible) return;
    setOrigin(null);
    setDestination(null);
    setPickerSide(null);
    setDurationOpen(false);
    setDurationHours(0);
    setDurationMinutes(0);
    setDurationDirty(false);
  }, [visible]);

  // 두 공항이 다 선택되고 사용자가 시간을 직접 수정하지 않았다면 추정값으로 자동 채움.
  useEffect(() => {
    if (!origin || !destination) return;
    if (durationDirty) return;
    if (origin.iata === destination.iata) return;
    const minutes = estimateFlightMinutes(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );
    setDurationHours(Math.floor(minutes / 60));
    setDurationMinutes(minutes % 60);
  }, [origin, destination, durationDirty]);

  // 총 비행 시간(분). 0이면 시작 불가.
  const totalMinutes = durationHours * 60 + durationMinutes;

  const validation = useMemo(() => {
    if (!origin || !destination) return { ok: false as const };
    if (origin.iata === destination.iata) return { ok: false as const };
    if (totalMinutes < 1) return { ok: false as const };
    return { ok: true as const };
  }, [origin, destination, totalMinutes]);

  const handleStart = () => {
    if (!validation.ok || !origin || !destination) return;
    const departAt = Date.now();
    const arriveAt = departAt + totalMinutes * 60_000;
    // Modal slide-down(약 0.3초)이 끝난 뒤에 비행 store를 set한다. 메인 화면 DotMap의
    // 자동 줌 시퀀스(출발지 → 두 공항 보이는 viewport, 1.5s)가 모달에 가려지지 않고
    // 사용자 시야에서 처음부터 끝까지 재생되도록 하기 위함.
    onClose();
    setTimeout(() => {
      void start(origin, destination, departAt, arriveAt);
    }, 350);
  };

  // 시간 필드에 표시할 텍스트. "Xh Ym" 형태. 0이면 placeholder.
  const durationPrimary =
    totalMinutes === 0
      ? "--"
      : durationHours === 0
        ? t("flight.minuteShort", { minutes: durationMinutes })
        : durationMinutes === 0
          ? t("flight.hourShort", { hours: durationHours })
          : t("flight.hourMinuteShort", {
              hours: durationHours,
              minutes: durationMinutes,
            });

  // 보조 텍스트: 두 공항 미선택이면 안내, 선택 + 자동 채움 직후면 "예상값 안내",
  // 사용자가 수동 수정했으면 표시하지 않는다.
  const durationSecondary =
    !origin || !destination
      ? t("flight.durationHintAuto")
      : !durationDirty && totalMinutes > 0
        ? t("flight.durationHintEstimate")
        : null;

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

          <Field
            styles={styles}
            label={t("flight.duration")}
            onPress={() => setDurationOpen(true)}
            empty={totalMinutes === 0}
            primary={durationPrimary}
            secondary={durationSecondary}
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

        <DurationPickerSheet
          visible={durationOpen}
          title={t("flight.duration")}
          initialHours={durationHours}
          initialMinutes={durationMinutes}
          onCancel={() => setDurationOpen(false)}
          onConfirm={(h, m) => {
            setDurationHours(h);
            setDurationMinutes(m);
            setDurationDirty(true);
            setDurationOpen(false);
          }}
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
