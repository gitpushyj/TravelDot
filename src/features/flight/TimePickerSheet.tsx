import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import WheelPicker, { type WheelItem } from "../../components/WheelPicker";
import { useTheme } from "../../theme/themeStore";
import type { Theme } from "../../theme/theme";

// 시각 입력 휠 시트. iOS 스타일 두 개의 휠(시간/분)을 가로로 배치.
// FlightInputModal에서 시각 필드를 탭하면 이 시트가 위로 슬라이드되며 올라온다.
// "완료"를 누르거나 backdrop을 누르면 닫힌다.

const FADE_MS = 220;
const SLIDE_MS = 260;
const SCREEN_H = Dimensions.get("window").height;

const HOUR_ITEMS: WheelItem[] = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: i.toString().padStart(2, "0"),
}));

const MINUTE_ITEMS: WheelItem[] = Array.from({ length: 60 }, (_, i) => ({
  value: String(i),
  label: i.toString().padStart(2, "0"),
}));

type Props = {
  visible: boolean;
  title: string;
  initialHour: number;
  initialMinute: number;
  onCancel: () => void;
  onConfirm: (hour: number, minute: number) => void;
};

export default function TimePickerSheet({
  visible,
  title,
  initialHour,
  initialMinute,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [hour, setHour] = useState(String(initialHour));
  const [minute, setMinute] = useState(String(initialMinute));

  // 시트가 열릴 때마다 외부에서 들어온 초기값으로 동기화.
  useEffect(() => {
    if (visible) {
      setHour(String(initialHour));
      setMinute(String(initialMinute));
    }
  }, [visible, initialHour, initialMinute]);

  // 슬라이드/페이드 직접 제어 — Modal의 슬라이드 애니메이션은 backdrop까지 함께
  // 슬라이드시키는 부작용이 있어 backdrop은 fade, 시트는 slide로 분리한다.
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

  const handleConfirm = () => {
    onConfirm(Number(hour), Number(minute));
  };

  if (!mountedVisible) return null;

  return (
    <Modal
      visible={mountedVisible}
      animationType="none"
      transparent
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Animated.View
        pointerEvents={visible ? "auto" : "none"}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
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
            <Pressable onPress={onCancel} hitSlop={10} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>{t("common.cancel")}</Text>
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              onPress={handleConfirm}
              hitSlop={10}
              style={styles.headerBtn}
            >
              <Text style={[styles.headerBtnText, styles.headerBtnTextPrimary]}>
                {t("common.confirm")}
              </Text>
            </Pressable>
          </View>

          <View style={styles.wheelsRow}>
            <View style={styles.wheelCol}>
              <WheelPicker
                items={HOUR_ITEMS}
                selectedValue={hour}
                onChange={setHour}
              />
            </View>
            <Text style={styles.colon}>:</Text>
            <View style={styles.wheelCol}>
              <WheelPicker
                items={MINUTE_ITEMS}
                selectedValue={minute}
                onChange={setMinute}
              />
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
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
      paddingBottom: 16,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.cardBorder,
      marginBottom: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    title: { color: theme.textPrimary, fontSize: 16, fontWeight: "700" },
    headerBtn: { paddingVertical: 4, paddingHorizontal: 8, minWidth: 64 },
    headerBtnText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontWeight: "600",
    },
    headerBtnTextPrimary: { color: theme.textPrimary, fontWeight: "800", textAlign: "right" },
    wheelsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingBottom: 8,
    },
    wheelCol: { flex: 1, maxWidth: 140 },
    colon: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: "800",
      marginHorizontal: 8,
    },
  });
}
