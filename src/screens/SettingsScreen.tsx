import React, { useMemo } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../features/auth/authStore";
import { deleteAccount } from "../features/auth/deleteAccount";
import { localizedBadgeTitle } from "../features/badges/badgeI18n";
import { pickActiveBadge, useBadgeStore } from "../features/badges/badgeStore";
import { COUNTRY_NAME_KO_BY_CODE } from "../features/badges/countryNames";
import { useEntitlementStore } from "../features/entitlement/entitlementStore";
import { evaluateMilestone } from "../features/milestone/milestoneEvaluator";
import { useMilestoneStore } from "../features/milestone/milestoneStore";
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
  onClose?: () => void;
  onAddTrip: () => void;
  onOpenTitles: () => void;
  onOpenMilestones: () => void;
  onChangeHome: () => void;
  onReviewSuspect: () => void;
  onOpenLanguage: () => void;
};

const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];

export default function SettingsScreen({
  onClose,
  onAddTrip,
  onOpenTitles,
  onOpenMilestones,
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

  const isAllMilestoneVisible = useEntitlementStore(
    (s) => s.isAllMilestoneVisible
  );
  const setAllMilestoneVisible = useEntitlementStore(
    (s) => s.setAllMilestoneVisible
  );
  const evaluateBadges = useVisitStore((s) => s.evaluateBadges);

  const onToggleAllMilestoneVisible = async (next: boolean) => {
    await setAllMilestoneVisible(next);
    await evaluateBadges();
  };

  const themeOptions: { mode: ThemeMode; label: string }[] = useMemo(
    () =>
      THEME_MODES.map((m) => ({
        mode: m,
        label: t(`settings.theme.${m}`),
      })),
    [t]
  );

  const handleIncrementalSync = () => {
    Alert.alert(
      t("settings.trips.scanIncrementalConfirmTitle"),
      t("settings.trips.scanIncrementalConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.trips.scanIncrementalConfirmAction"),
          onPress: () => {
            runIncrementalSync().catch((e) =>
              Alert.alert(t("scan.scanFailed"), String(e))
            );
          },
        },
      ]
    );
  };
  const handleFullSync = () => {
    Alert.alert(
      t("settings.trips.scanFullConfirmTitle"),
      t("settings.trips.scanFullConfirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.trips.scanFullConfirmAction"),
          onPress: () => {
            runFullSync().catch((e) =>
              Alert.alert(t("scan.scanFailed"), String(e))
            );
          },
        },
      ]
    );
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

  const milestoneKind = useMilestoneStore((s) => s.kind);
  const premiumContext = useVisitStore((s) => s.premiumContext);
  const milestoneProgress = useMemo(
    () => evaluateMilestone(milestoneKind, { visitCounts, premiumContext }),
    [milestoneKind, visitCounts, premiumContext]
  );
  const milestoneSub = milestoneProgress.reachedFinal
    ? t("settings.milestone.previewCompleted", {
        name: t(`milestones.option.${milestoneKind}`),
      })
    : t("settings.milestone.previewProgress", {
        name: t(`milestones.option.${milestoneKind}`),
        current: milestoneProgress.current,
        next: milestoneProgress.next,
        unit:
          milestoneProgress.unit === "days"
            ? t("home.daysUnit")
            : t("home.countriesUnit"),
      });

  const currentLocale = (
    (SUPPORTED_LOCALES as readonly string[]).includes(i18n.language)
      ? i18n.language
      : "en"
  ) as SupportedLocale;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {onClose ? (
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.cancel}>{t("common.close")}</Text>
          </Pressable>
        ) : (
          <View style={{ minWidth: 40 }} />
        )}
        <Text style={styles.title}>{t("settings.heading")}</Text>
        <View style={{ minWidth: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>
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
          {t("settings.section.appSettings")}
        </Text>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            {themeOptions.map((opt, idx) => {
              const selected = mode === opt.mode;
              return (
                <Pressable
                  key={opt.mode}
                  onPress={() => void setMode(opt.mode)}
                  style={({ pressed }) => [
                    styles.themeCell,
                    idx > 0 && styles.themeCellDivider,
                    pressed && !selected && { opacity: 0.6 },
                  ]}
                >
                  <Text
                    style={[
                      styles.themeCellText,
                      selected && styles.themeCellTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <ActionRow
            theme={theme}
            label={t("settings.language.label")}
            sub={LOCALE_LABELS[currentLocale]}
            onPress={onOpenLanguage}
            divider
          />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t("settings.section.features")}
        </Text>
        <View style={styles.card}>
          <ActionRow
            theme={theme}
            label={t("settings.title.label")}
            sub={titleSub}
            onPress={onOpenTitles}
          />
          <ActionRow
            theme={theme}
            label={t("settings.milestone.label")}
            sub={milestoneSub}
            onPress={onOpenMilestones}
            divider
          />
          {!homeChanged && (
            <ActionRow
              theme={theme}
              label={t("settings.home.changeWithName", {
                name: homeCountry
                  ? homeCountry.name
                  : t("settings.home.notSet"),
              })}
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

        {__DEV__ && (
          <>
            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
              {t("settings.section.dev")}
            </Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>
                    {t("settings.devAllMilestonesVisible.title")}
                  </Text>
                  <Text style={styles.rowSub}>
                    {t("settings.devAllMilestonesVisible.subtitle")}
                  </Text>
                </View>
                <Switch
                  value={isAllMilestoneVisible}
                  onValueChange={onToggleAllMilestoneVisible}
                />
              </View>
            </View>
          </>
        )}

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
