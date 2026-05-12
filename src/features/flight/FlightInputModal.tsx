import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
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
import { track } from "../../lib/tracking";

import AirportPicker from "./AirportPicker";
import type { Airport } from "./airports";
import DurationPickerSheet from "./DurationPickerSheet";
import { estimateFlightMinutes } from "./estimateFlightDuration";
import { useFlightStore } from "./flightStore";

const FADE_MS = 220;
const SLIDE_MS = 260;
const SCREEN_H = Dimensions.get("window").height;

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
    track("flight_start_submitted", {
      origin: origin.iata,
      destination: destination.iata,
      duration_min: totalMinutes,
      // 자동 추정값을 그대로 썼는지 vs 사용자가 직접 휠을 돌렸는지
      duration_edited: durationDirty,
    });
    // store를 즉시 set하고 modal을 닫는다. 자동 줌 시퀀스는 DotMap에서 setTimeout으로
    // modal slide-down 시간만큼 기다린 뒤 시작되므로, 여기서 별도 sequencing이 필요 없다.
    void start(origin, destination, departAt, arriveAt);
    onClose();
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

  // backdrop fade + sheet slide 직접 제어. Modal animationType="slide"는 backdrop까지
  // 같이 슬라이드시키는 부작용이 있고, presentationStyle="pageSheet"는 항상 화면을
  // 거의 다 채우는 큰 sheet라 content 양에 비해 비어 보였다. content 높이에 맞는
  // bottom sheet로 띄워 입력 양에 맞춰 자연스러워진다.
  const [mountedVisible, setMountedVisible] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    if (visible) {
      setMountedVisible(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: FADE_MS,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: SLIDE_MS,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    } else if (mountedVisible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: FADE_MS,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(sheetTranslateY, {
          toValue: SCREEN_H,
          duration: SLIDE_MS,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start(({ finished }) => {
        if (finished) setMountedVisible(false);
      });
    }
  }, [visible, mountedVisible, backdropOpacity, sheetTranslateY]);

  if (!mountedVisible) return null;

  return (
    <Modal
      visible={mountedVisible}
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheetWrap,
          { transform: [{ translateY: sheetTranslateY }] },
        ]}
      >
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.handle} />
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
        </SafeAreaView>
      </Animated.View>

      <AirportPicker
        visible={pickerSide !== null}
        title={
          pickerSide === "origin"
            ? t("flight.origin")
            : t("flight.destination")
        }
        side={pickerSide === "destination" ? "destination" : "origin"}
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
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheetWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheet: {
      backgroundColor: theme.cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
      // 입력 컨텐츠가 늘어도 너무 커지지 않도록 화면의 약 80%까지로 제한. 일반적인
      // 입력량(3 필드 + 시작 버튼)에서는 이 limit보다 훨씬 작게 fit된다.
      maxHeight: SCREEN_H * 0.8,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.cardBorder,
      marginBottom: 12,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
    },
    title: { color: theme.textPrimary, fontSize: 18, fontWeight: "700" },
    closeBtn: { padding: 4 },
    closeIcon: { color: theme.textPrimary, fontSize: 18, fontWeight: "700" },
    content: { paddingHorizontal: 16, paddingBottom: 16, gap: 4 },
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
