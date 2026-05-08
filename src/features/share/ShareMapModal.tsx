import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import type { Theme } from "../../theme/theme";
import ShareMapCard, {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "./ShareMapCard";
import {
  captureShareCard,
  saveImageToLibrary,
  shareImage,
} from "./shareMapImage";

type Props = {
  visible: boolean;
  onClose: () => void;
  theme: Theme;
  visitCounts: Record<string, number>;
  badgeEmoji: string | null;
  badgeTitle: string | null;
  countries: number;
  days: number;
  yearLabel: string;
};

type Toast = { kind: "info" | "error"; message: string } | null;

export default function ShareMapModal({
  visible,
  onClose,
  theme,
  visitCounts,
  badgeEmoji,
  badgeTitle,
  countries,
  days,
  yearLabel,
}: Props) {
  const { t } = useTranslation();
  const cardRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  // 모달이 닫히면 토스트도 초기화한다.
  useEffect(() => {
    if (!visible) setToast(null);
  }, [visible]);

  // 토스트는 2초 뒤 자동 사라진다.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  // 화면 폭에 맞춰 1080×1920 카드를 축소 표시할 scale을 계산한다.
  const previewLayout = useMemo(() => {
    const screen = Dimensions.get("window");
    const horizontalPadding = 32;
    const reservedHeight = 280; // 헤더 + 버튼 row + 여백
    const maxW = screen.width - horizontalPadding * 2;
    const maxH = screen.height - reservedHeight - insets.top - insets.bottom;
    const scaleByW = maxW / SHARE_CARD_WIDTH;
    const scaleByH = maxH / SHARE_CARD_HEIGHT;
    const scale = Math.max(0.05, Math.min(scaleByW, scaleByH));
    return {
      scale,
      width: SHARE_CARD_WIDTH * scale,
      height: SHARE_CARD_HEIGHT * scale,
    };
  }, [insets.top, insets.bottom]);

  const runShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { uri } = await captureShareCard(cardRef);
      const status = await shareImage(uri, t("share.dialogTitle"));
      if (status === "unavailable") {
        Alert.alert(t("share.notAvailableTitle"), t("share.notAvailableBody"));
      } else if (status === "failed") {
        setToast({ kind: "error", message: t("share.captureFailed") });
      }
    } catch {
      setToast({ kind: "error", message: t("share.captureFailed") });
    } finally {
      setBusy(false);
    }
  };

  const runSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { uri } = await captureShareCard(cardRef);
      const status = await saveImageToLibrary(uri);
      if (status === "saved") {
        setToast({ kind: "info", message: t("share.savedToast") });
      } else if (status === "permission-denied") {
        Alert.alert(
          t("share.permissionDeniedTitle"),
          t("share.permissionDeniedBody")
        );
      } else {
        setToast({ kind: "error", message: t("share.saveFailed") });
      }
    } catch {
      setToast({ kind: "error", message: t("share.captureFailed") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("share.previewTitle")}</Text>
        </View>

        <View style={styles.previewArea}>
          <View
            style={[
              styles.previewBox,
              { width: previewLayout.width, height: previewLayout.height },
            ]}
          >
            {/*
              1080×1920 카드를 좌상단 기준으로 축소해 미리보기 박스에 채운다.
              카드 본체의 layout frame은 1080×1920 그대로 유지되어, view-shot이
              unscaled bounds 기준으로 캡처할 때 본래 해상도가 그대로 PNG로 나온다.
            */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: [{ scale: previewLayout.scale }],
                transformOrigin: "top left",
              }}
            >
              <ShareMapCard
                ref={cardRef}
                theme={theme}
                visitCounts={visitCounts}
                badgeEmoji={badgeEmoji}
                badgeTitle={badgeTitle}
                countries={countries}
                days={days}
                yearLabel={yearLabel}
                countriesUnit={t("home.countriesUnit")}
                daysUnit={t("home.daysUnit")}
              />
            </View>
          </View>
        </View>

        {toast ? (
          <View
            style={[
              styles.toast,
              toast.kind === "error" && styles.toastError,
            ]}
          >
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        ) : null}

        <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={onClose}
            disabled={busy}
            style={({ pressed }) => [
              styles.btn,
              styles.btnGhost,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnGhostText}>{t("share.cancel")}</Text>
          </Pressable>
          <Pressable
            onPress={runSave}
            disabled={busy}
            style={({ pressed }) => [
              styles.btn,
              styles.btnSecondary,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnSecondaryText}>{t("share.save")}</Text>
          </Pressable>
          <Pressable
            onPress={runShare}
            disabled={busy}
            style={({ pressed }) => [
              styles.btn,
              styles.btnPrimary,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnPrimaryText}>{t("share.confirm")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.85)",
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      alignItems: "center",
    },
    title: {
      color: "#ffffff",
      fontSize: 17,
      fontWeight: "800",
    },
    previewArea: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    previewBox: {
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: theme.homeBg,
      shadowColor: "#000",
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 24,
      elevation: 12,
    },
    toast: {
      position: "absolute",
      bottom: 120,
      alignSelf: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: "rgba(20,20,20,0.92)",
    },
    toastError: {
      backgroundColor: "rgba(180,40,40,0.95)",
    },
    toastText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "700",
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    btn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    btnPressed: {
      opacity: 0.7,
    },
    btnGhost: {
      backgroundColor: "rgba(255,255,255,0.08)",
    },
    btnGhostText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "700",
    },
    btnSecondary: {
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    btnSecondaryText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "800",
    },
    btnPrimary: {
      backgroundColor: theme.accent,
    },
    btnPrimaryText: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "800",
    },
  });
}
