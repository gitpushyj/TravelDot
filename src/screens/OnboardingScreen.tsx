import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import CountryPicker from "../components/CountryPicker";
import { runFullSync } from "../features/photoSync/syncService";
import { useVisitStore } from "../features/travel/visitStore";
import type { Theme } from "../theme/theme";
import { useTheme } from "../theme/themeStore";

type Mode = "initial" | "change";

type Props = {
  mode?: Mode;
  onClose?: () => void;
  /** 초기 모드에서 본국이 저장되면 호출. 호출 측은 스캔 화면으로 전환한다. */
  onAfterSetup?: () => void;
};

export default function OnboardingScreen({
  mode = "initial",
  onClose,
  onAfterSetup,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const setHomeCountry = useVisitStore((s) => s.setHomeCountry);
  const changeHomeCountry = useVisitStore((s) => s.changeHomeCountry);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const onSelect = async (entry: {
    code: string;
    name: string;
    nameKo: string;
  }) => {
    if (submitting) return;
    Keyboard.dismiss();
    setSelectedCode(entry.code);
    setSubmitting(true);
    // 초기 모드에서는 setHomeCountry가 끝나기 전에 화면이 깜빡이지 않도록
    // 미리 스캔 화면으로 전환 신호를 보낸다. InitialScanScreen은 homeCountry가
    // 채워지는 것을 보고 스캔을 시작한다.
    if (mode === "initial") {
      onAfterSetup?.();
    }
    try {
      if (mode === "change") {
        await changeHomeCountry({ code: entry.code, name: entry.nameKo });
        // 본국 변경은 기존 메인 화면으로 돌아가 스캔이 백그라운드로 진행된다.
        runFullSync().catch((err) => {
          console.warn("[VisitGrid] sync failed", err);
        });
        onClose?.();
      } else {
        await setHomeCountry({ code: entry.code, name: entry.nameKo });
        // 스캔 트리거는 InitialScanScreen이 담당한다.
      }
    } catch (e) {
      Alert.alert(t("alerts.saveFailed"), String(e));
      setSubmitting(false);
    }
  };

  const isChange = mode === "change";

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {isChange && onClose && (
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <Text style={styles.closeText}>{t("common.close")}</Text>
          </Pressable>
        )}
        <Text style={styles.title}>
          {isChange ? t("changeHome.title") : t("onboarding.home.title")}
        </Text>
        <Text style={styles.subtitle}>
          {isChange ? t("changeHome.subtitle") : t("onboarding.home.subtitle")}
        </Text>
      </View>
      <View style={styles.body}>
        <CountryPicker onSelect={onSelect} selectedCode={selectedCode} />
        {submitting && (
          <View style={styles.overlay}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.overlayText}>
              {isChange
                ? t("changeHome.loadingChanging")
                : t("changeHome.loadingPreparing")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 36,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    closeBtn: {
      alignSelf: "flex-start",
      paddingVertical: 4,
      marginBottom: 8,
    },
    closeText: {
      color: theme.textSecondary,
      fontSize: 15,
      fontWeight: "600",
    },
    title: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "700",
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 13,
      marginTop: 6,
      lineHeight: 18,
    },
    body: {
      flex: 1,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    overlayText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },
  });
}
