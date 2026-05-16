import React, { useEffect, useMemo, useState } from "react";
import {
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from "expo-keep-awake";
import * as MediaLibrary from "expo-media-library";

import { ensurePermission } from "../../features/photoSync/photoLibrary";
import { runFullSync } from "../../features/photoSync/syncService";
import { useVisitStore } from "../../features/travel/visitStore";
import { useTheme } from "../../theme/themeStore";

const KEEP_AWAKE_TAG = "onboarding-sync";

import { makeOnboardingStyles } from "./styles";
import SyncFeatureRows from "./SyncFeatureRows";
import SyncHero from "./SyncHero";
import SyncingAutoNextNotice from "./SyncingAutoNextNotice";
import SyncingHero from "./SyncingHero";
import SyncingProgressCard from "./SyncingProgressCard";
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

  // 동기화 진행 중에는 화면이 꺼지지 않도록 유지.
  // 사진 라이브러리 전수 스캔이 길어질 수 있어 자동 잠금으로 진행이 끊기는 것을 막는다.
  useEffect(() => {
    if (phase !== "syncing") return;
    void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, [phase]);

  const beginSync = (access: "granted" | "limited") => {
    setPermission(access);
    setPhase("syncing");
    runFullSync("onboarding").catch(() => {
      // 실패는 lastSync.error로 보고된다. 여기서는 흡수.
    });
  };

  const startSync = async () => {
    if (phase === "syncing") return;
    // 한 번 거부된 권한은 requestPermissionsAsync로 다이얼로그가 다시 뜨지 않고
    // 즉시 denied가 반환된다. canAskAgain이 false면 OS 설정 앱으로 보낸다.
    const current = await MediaLibrary.getPermissionsAsync();
    if (current.status !== "granted" && !current.canAskAgain) {
      await Linking.openSettings();
      return;
    }
    const result = await ensurePermission();
    setPermission(result);
    if (result === "denied") {
      setPhase("denied");
      return;
    }
    beginSync(result);
  };

  // 사용자가 설정에서 권한을 켜고 돌아온 경우 자동으로 다음 단계로 진행한다.
  // denied 화면에서만 청취해 불필요한 리스너를 줄인다.
  useEffect(() => {
    if (phase !== "denied") return;
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      const current = await MediaLibrary.getPermissionsAsync();
      if (current.status !== "granted") return;
      const access =
        current.accessPrivileges === "limited" ? "limited" : "granted";
      beginSync(access);
    });
    return () => sub.remove();
  }, [phase]);

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
    return (
      <ScrollView
        style={localStyles.scroll}
        contentContainerStyle={localStyles.syncingContent}
        showsVerticalScrollIndicator={false}
      >
        <SyncingHero
          theme={theme}
          titleLine1={t("onboarding.sync.analyzingTitleLine1")}
          titleHighlight={t("onboarding.sync.analyzingTitleHighlight")}
          subtitle={t("onboarding.sync.analyzingSubtitle")}
        />
        <View style={localStyles.syncingCard}>
          <SyncingProgressCard
            theme={theme}
            phase={syncStatus.phase}
            step1={{
              title: t("onboarding.sync.analyzingStep1.title"),
              desc: t("onboarding.sync.analyzingStep1.desc"),
            }}
            step2={{
              title: t("onboarding.sync.analyzingStep2.title"),
              desc: t("onboarding.sync.analyzingStep2.desc"),
            }}
            step1Progress={
              syncStatus.phase === "scanning"
                ? {
                    processed: syncStatus.phaseProcessed ?? 0,
                    total: syncStatus.phaseTotal ?? 0,
                  }
                : null
            }
            step2Progress={
              syncStatus.phase === "saving"
                ? {
                    processed: syncStatus.phaseProcessed ?? 0,
                    total: syncStatus.phaseTotal ?? 0,
                  }
                : null
            }
          />
        </View>
        <View style={localStyles.syncingNotice}>
          <SyncingAutoNextNotice
            theme={theme}
            prefix={t("onboarding.sync.analyzingAutoNext.prefix")}
            highlight={t("onboarding.sync.analyzingAutoNext.highlight")}
            suffix={t("onboarding.sync.analyzingAutoNext.suffix")}
          />
        </View>
        {permission === "limited" && (
          <Text style={[styles.smallNote, localStyles.syncingLimited]}>
            {t("onboarding.sync.limitedHint")}
          </Text>
        )}
      </ScrollView>
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
            titlePrefix={t("onboarding.sync.fullAccessHint.prefix")}
            titleHighlight={t("onboarding.sync.fullAccessHint.highlight")}
            titleSuffix={t("onboarding.sync.fullAccessHint.suffix")}
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
  syncingContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  syncingCard: {
    marginTop: 22,
  },
  syncingNotice: {
    marginTop: 14,
  },
  syncingLimited: {
    marginTop: 12,
  },
});
