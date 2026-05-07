import { useEffect, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onManual: () => void;
  onAutoScan: () => void;
};

const OPEN_DURATION = 240;
const CLOSE_DURATION = 200;

export default function AddTripActionSheet({
  visible,
  onCancel,
  onManual,
  onAutoScan,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();

  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const sheetHeight = useSharedValue(1000);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, {
        duration: OPEN_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    } else if (mounted) {
      progress.value = withTiming(
        0,
        { duration: CLOSE_DURATION, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(setMounted)(false);
          }
        },
      );
    }
  }, [visible, mounted, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * sheetHeight.value }],
  }));

  const onSheetLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) sheetHeight.value = h;
  };

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            // Android edge-to-edge에서 sheet가 navigation bar 위로 밀려 올라오도록
            // 동적 inset 을 더한다. iOS 는 0 이라 기존 28dp 디자인 그대로.
            { paddingBottom: (Platform.OS === "ios" ? 28 : 16) + bottomInset },
          ]}
          onLayout={onSheetLayout}
        >
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t("addTripSheet.title")}</Text>
            <Text style={styles.subtitle}>{t("addTripSheet.subtitle")}</Text>
          </View>

          <View style={styles.options}>
            <OptionRow
              theme={theme}
              icon="✎"
              label={t("addTripSheet.manualLabel")}
              sub={t("addTripSheet.manualSub")}
              onPress={onManual}
            />
            <OptionRow
              theme={theme}
              icon="✨"
              label={t("addTripSheet.scanLabel")}
              sub={t("addTripSheet.scanSub")}
              onPress={onAutoScan}
            />
          </View>

          <Pressable
            onPress={onCancel}
            hitSlop={6}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && styles.cancelBtnPressed,
            ]}
          >
            <Text style={styles.cancelText}>{t("common.cancel")}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function OptionRow({
  theme,
  icon,
  label,
  sub,
  onPress,
}: {
  theme: Theme;
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.backdrop,
    },
    sheet: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.sheetBg,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingTop: 6,
      paddingBottom: Platform.OS === "ios" ? 28 : 16,
    },
    handleWrap: {
      alignItems: "center",
      paddingTop: 6,
      paddingBottom: 8,
    },
    handle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.handleColor,
    },
    headerRow: {
      paddingHorizontal: 22,
      paddingTop: 6,
      paddingBottom: 14,
      gap: 4,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: "800",
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    options: {
      paddingHorizontal: 12,
      paddingBottom: 8,
      gap: 6,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 14,
    },
    rowPressed: {
      backgroundColor: theme.rowPressedBg,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.accentSoftBg,
    },
    icon: {
      fontSize: 18,
      color: theme.accentSoftText,
    },
    rowMain: {
      flex: 1,
      gap: 2,
    },
    rowLabel: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "800",
    },
    rowSub: {
      color: theme.textSecondary,
      fontSize: 12,
      lineHeight: 17,
    },
    chevron: {
      color: theme.textMuted,
      fontSize: 22,
      fontWeight: "300",
      marginRight: 4,
    },
    cancelBtn: {
      marginTop: 8,
      marginHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: theme.tabRowBg,
      alignItems: "center",
    },
    cancelBtnPressed: { opacity: 0.7 },
    cancelText: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
