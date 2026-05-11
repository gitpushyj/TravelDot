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

// 비행 시간(시간:분) 입력 휠 시트. iOS 스타일 두 휠을 가로로 배치.
// 시 = 0~23, 분 = 0~59. 휠 가운데 콜론 대신 단위 라벨("시간"/"분")을 둬
// 시각이 아니라 duration임을 명확히 한다.

const FADE_MS = 220;
const SLIDE_MS = 260;
const SCREEN_H = Dimensions.get("window").height;

const HOUR_ITEMS: WheelItem[] = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: String(i),
}));

const MINUTE_ITEMS: WheelItem[] = Array.from({ length: 60 }, (_, i) => ({
  value: String(i),
  label: i.toString().padStart(2, "0"),
}));

type Props = {
  visible: boolean;
  title: string;
  initialHours: number;
  initialMinutes: number;
  onCancel: () => void;
  onConfirm: (hours: number, minutes: number) => void;
};

export default function DurationPickerSheet({
  visible,
  title,
  initialHours,
  initialMinutes,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [hours, setHours] = useState(String(initialHours));
  const [minutes, setMinutes] = useState(String(initialMinutes));

  // 시트가 열릴 때마다 외부에서 들어온 초기값으로 동기화.
  useEffect(() => {
    if (visible) {
      setHours(String(initialHours));
      setMinutes(String(initialMinutes));
    }
  }, [visible, initialHours, initialMinutes]);

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
    onConfirm(Number(hours), Number(minutes));
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
                selectedValue={hours}
                onChange={setHours}
              />
            </View>
            <Text style={styles.unit}>{t("flight.unitHour")}</Text>
            <View style={styles.wheelCol}>
              <WheelPicker
                items={MINUTE_ITEMS}
                selectedValue={minutes}
                onChange={setMinutes}
              />
            </View>
            <Text style={styles.unit}>{t("flight.unitMinute")}</Text>
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
      // Android 제스처 내비에서 휠 하단을 돌릴 때 한손모드(home indicator를 아래로
      // 쓸어내리는 제스처)가 트리거되는 걸 막기 위해 SafeArea bottom inset 위에
      // 추가 여유를 둔다.
      paddingBottom: 32,
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
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    wheelCol: { flex: 1, maxWidth: 110 },
    unit: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      marginHorizontal: 6,
    },
  });
}
