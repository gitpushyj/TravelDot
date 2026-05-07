import React, { useMemo } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../features/auth/authStore";
import { deleteAccount } from "../features/auth/deleteAccount";
import { localizedBadgeTitle } from "../features/badges/badgeI18n";
import { pickActiveBadge, useBadgeStore } from "../features/badges/badgeStore";
import { COUNTRY_NAME_KO_BY_CODE } from "../features/badges/countryNames";
import {
  runFullSync,
  runIncrementalSync,
} from "../features/photoSync/syncService";
import { getTierByCount } from "../features/travel/tierTitles";
import { useVisitStore } from "../features/travel/visitStore";
import {
  getCurrentLocale,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../i18n";
import type { ThemeMode } from "../theme/theme";
import { useTheme, useThemeStore } from "../theme/themeStore";

import ActionRow from "./SettingsScreen/ActionRow";
import { makeStyles } from "./SettingsScreen/styles";

type Props = {
  onClose: () => void;
  onAddTrip: () => void;
  onOpenTitles: () => void;
  onChangeHome: () => void;
  onReviewSuspect: () => void;
  onOpenLanguage: () => void;
};

const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];

export default function SettingsScreen({
  onClose,
  onAddTrip,
  onOpenTitles,
  onChangeHome,
  onReviewSuspect,
  onOpenLanguage,
}: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const activeId = useBadgeStore((s) => s.activeId);
  const visitCounts = useVisitStore((s) => s.visitCounts);
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const homeChanged = useVisitStore((s) => s.homeChanged);
  const suspectTrips = useVisitStore((s) => s.suspectTrips);

  const authUser = useAuthStore((s) => s.user);
  const authSignOut = useAuthStore((s) => s.signOut);

  const themeOptions: { mode: ThemeMode; label: string }[] = useMemo(
    () =>
      THEME_MODES.map((m) => ({
        mode: m,
        label: t(`settings.theme.${m}`),
      })),
    [t]
  );

  const handleIncrementalSync = () => {
    runIncrementalSync().catch((e) =>
      Alert.alert(t("scan.scanFailed"), String(e))
    );
  };
  const handleFullSync = () => {
    runFullSync().catch((e) => Alert.alert(t("scan.scanFailed"), String(e)));
  };
  const handleSignOut = () => {
    Alert.alert(
      t("settings.account.signOutConfirmTitle"),
      t("settings.account.signOutConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.account.signOut"),
          style: "destructive",
          onPress: () => {
            authSignOut().catch((e) =>
              Alert.alert(t("settings.account.signOutFailed"), String(e))
            );
          },
        },
      ]
    );
  };
  // 로그인은 필수이므로 SettingsScreen 진입 시 user는 항상 존재한다.
  const accountLabel =
    (authUser?.user_metadata?.full_name as string | undefined) ??
    authUser?.email ??
    t("settings.account.google");
  const accountSub = authUser?.email ?? t("settings.account.googleSub");

  const handleDeleteAccount = () => {
    Alert.alert(
      t("settings.account.deleteConfirmTitle"),
      t("settings.account.deleteConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.account.deleteAction"),
          style: "destructive",
          onPress: () => {
            deleteAccount().catch((e) =>
              Alert.alert(t("settings.account.deleteFailed"), String(e))
            );
          },
        },
      ]
    );
  };

  const handleChangeHome = () => {
    Alert.alert(
      t("settings.home.changeConfirmTitle"),
      t("settings.home.changeConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.confirm"),
          style: "destructive",
          onPress: onChangeHome,
        },
      ]
    );
  };

  // 현재 호칭 미리보기 — 활성 뱃지 또는 자동 모드의 등급 뱃지
  const activeBadge = useMemo(() => {
    const tier = getTierByCount(Object.keys(visitCounts).length);
    return pickActiveBadge(activeId, `tier_${tier.id}`, COUNTRY_NAME_KO_BY_CODE);
  }, [activeId, visitCounts]);

  const titleSub = activeBadge
    ? activeId == null
      ? t("settings.title.previewAuto", {
          emoji: activeBadge.emoji,
          title: localizedBadgeTitle(activeBadge, t, getCurrentLocale()),
        })
      : t("settings.title.preview", {
          emoji: activeBadge.emoji,
          title: localizedBadgeTitle(activeBadge, t, getCurrentLocale()),
        })
    : t("settings.title.none");

  const currentLocale = (
    (SUPPORTED_LOCALES as readonly string[]).includes(i18n.language)
      ? i18n.language
      : "en"
  ) as SupportedLocale;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.cancel}>{t("common.close")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("settings.heading")}</Text>
        <View style={{ minWidth: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>{t("settings.section.theme")}</Text>
        <View style={styles.segment}>
          {themeOptions.map((opt) => {
            const selected = mode === opt.mode;
            return (
              <Pressable
                key={opt.mode}
                onPress={() => void setMode(opt.mode)}
                style={({ pressed }) => [
                  styles.segmentItem,
                  selected && styles.segmentItemActive,
                  pressed && !selected && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    selected && styles.segmentTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t("settings.section.title")}
        </Text>
        <View style={styles.card}>
          <ActionRow
            theme={theme}
            label={t("settings.title.label")}
            sub={titleSub}
            onPress={onOpenTitles}
          />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t("settings.section.language")}
        </Text>
        <View style={styles.card}>
          <ActionRow
            theme={theme}
            label={t("settings.language.label")}
            sub={LOCALE_LABELS[currentLocale]}
            onPress={onOpenLanguage}
          />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t("settings.section.account")}
        </Text>
        <View style={styles.card}>
          <ActionRow
            theme={theme}
            label={accountLabel}
            sub={accountSub}
            onPress={() => {}}
            disabled
          />
          <ActionRow
            theme={theme}
            label={t("settings.account.signOut")}
            sub={t("settings.account.signOutSub")}
            onPress={handleSignOut}
            divider
          />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t("settings.section.home")}
        </Text>
        <View style={styles.card}>
          <ActionRow
            theme={theme}
            label={t("settings.home.current")}
            sub={homeCountry ? homeCountry.name : t("settings.home.notSet")}
            onPress={() => {}}
            disabled
          />
          {!homeChanged && (
            <ActionRow
              theme={theme}
              label={t("settings.home.change")}
              sub={t("settings.home.changeSub")}
              onPress={handleChangeHome}
              divider
            />
          )}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t("settings.section.trips")}
        </Text>
        <View style={styles.card}>
          <ActionRow
            theme={theme}
            label={t("settings.trips.addManually")}
            sub={t("settings.trips.addManuallySub")}
            onPress={onAddTrip}
          />
          <ActionRow
            theme={theme}
            label={t("settings.trips.scanIncremental")}
            sub={t("settings.trips.scanIncrementalSub")}
            onPress={handleIncrementalSync}
            divider
          />
          <ActionRow
            theme={theme}
            label={t("settings.trips.scanFull")}
            sub={t("settings.trips.scanFullSub")}
            onPress={handleFullSync}
            divider
          />
          {suspectTrips.length > 0 && (
            <ActionRow
              theme={theme}
              label={t("settings.trips.review", { count: suspectTrips.length })}
              sub={t("settings.trips.reviewSub")}
              onPress={onReviewSuspect}
              divider
            />
          )}
        </View>

        <View style={styles.deleteAccountWrap}>
          <Pressable onPress={handleDeleteAccount} hitSlop={8}>
            <Text style={styles.deleteAccountText}>
              {t("settings.account.deleteLink")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
