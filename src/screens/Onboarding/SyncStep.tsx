import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { ensurePermission } from "../../features/photoSync/photoLibrary";
import { runFullSync } from "../../features/photoSync/syncService";
import { useVisitStore } from "../../features/travel/visitStore";
import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";
import SyncFeatureRows from "./SyncFeatureRows";
import SyncHero from "./SyncHero";
import SyncPermissionNotice from "./SyncPermissionNotice";

type Phase = "idle" | "syncing" | "denied";

type Props = { onNext: () => void };

export default function SyncStep({ onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);

  const syncStatus = useVisitStore((s) => s.syncStatus);
  const lastSync = useVisitStore((s) => s.lastSync);

  const [phase, setPhase] = useState<Phase>("idle");
  const [permission, setPermission] = useState<
    "granted" | "limited" | "denied" | null
  >(null);

  // 동기화가 끝나 lastSync가 채워지면 다음 step으로 이동.
  // permission이 denied면 SyncStep 안에서 머무른다.
  useEffect(() => {
    if (phase !== "syncing") return;
    if (!lastSync) return;
    if (lastSync.permission === "denied") {
      setPhase("denied");
      return;
    }
    onNext();
  }, [phase, lastSync, onNext]);

  const startSync = async () => {
    if (phase === "syncing") return;
    const result = await ensurePermission();
    setPermission(result);
    if (result === "denied") {
      setPhase("denied");
      return;
    }
    setPhase("syncing");
    runFullSync().catch(() => {
      // 실패는 lastSync.error로 보고된다. 여기서는 흡수.
    });
  };

  if (phase === "denied") {
    return (
      <>
        <View style={styles.body}>
          <Text style={styles.title}>
            {t("onboarding.sync.permissionDeniedTitle")}
          </Text>
          <Text style={styles.subtitle}>
            {t("onboarding.sync.permissionDeniedBody")}
          </Text>
        </View>
        <View style={styles.footer}>
          <Pressable
            onPress={startSync}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {t("onboarding.sync.requestAgain")}
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  if (phase === "syncing") {
    const processed = syncStatus.processed;
    const message =
      syncStatus.phase === "saving"
        ? t("onboarding.sync.saving")
        : syncStatus.phase === "verifying"
          ? t("onboarding.sync.verifying")
          : processed > 0
            ? t("onboarding.sync.scanning", { processed })
            : t("onboarding.sync.preparing");
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator color={theme.accent} size="large" />
        <Text style={styles.centerTitle}>{message}</Text>
        {permission === "limited" && (
          <Text style={styles.smallNote}>{t("onboarding.sync.limitedHint")}</Text>
        )}
      </View>
    );
  }

  // idle — 새 디자인
  return (
    <>
      <ScrollView
        style={localStyles.scroll}
        contentContainerStyle={localStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <SyncHero
          theme={theme}
          title={t("onboarding.sync.title")}
          subtitle={t("onboarding.sync.body")}
        />

        <View style={localStyles.notice}>
          <SyncPermissionNotice
            theme={theme}
            title={t("onboarding.sync.fullAccessHint")}
            body={t("onboarding.sync.cloudOnlyNote")}
          />
        </View>

        <View style={localStyles.cards}>
          <SyncFeatureRows theme={theme} />
        </View>
      </ScrollView>
      <View style={localStyles.cta}>
        <Pressable
          onPress={startSync}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
          ]}
        >
          <Text style={styles.primaryBtnText}>{t("onboarding.sync.button")}</Text>
        </Pressable>
      </View>
    </>
  );
}

const localStyles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  notice: {
    marginTop: 20,
  },
  cards: {
    marginTop: 18,
  },
  cta: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
});
