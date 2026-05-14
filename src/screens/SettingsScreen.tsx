import React, { useMemo } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import AppleLogoIcon from "../components/auth/AppleLogoIcon";
import GoogleGIcon from "../components/auth/GoogleGIcon";
import { useAuthStore } from "../features/auth/authStore";
import { deleteAccount } from "../features/auth/deleteAccount";
import { logOutAndWipeLocal } from "../features/auth/logOut";
import { useProfileStore } from "../features/onboarding/profileStore";
import { localizedBadgeTitle } from "../features/badges/badgeI18n";
import { pickActiveBadge, useBadgeStore } from "../features/badges/badgeStore";
import { COUNTRY_NAME_KO_BY_CODE } from "../features/badges/countryNames";
import { evaluateMilestone } from "../features/milestone/milestoneEvaluator";
import { openStoreSubscriptionManagement } from "../features/subscription/storeSubscriptionLink";
import { useSubscription } from "../features/subscription/useSubscription";
import { useMilestoneStore } from "../features/milestone/milestoneStore";
import { LEGAL_URLS } from "../lib/legal";
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
import SubscriptionEntryCard from "./SettingsScreen/SubscriptionEntryCard";
import { makeStyles } from "./SettingsScreen/styles";

type Props = {
  onClose?: () => void;
  onAddTrip: () => void;
  onOpenTitles: () => void;
  onOpenMilestones: () => void;
  onChangeHome: () => void;
  onReviewSuspect: () => void;
  onOpenLanguage: () => void;
  onOpenMapAppearance: () => void;
  onOpenSubscription: () => void;
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
  onOpenMapAppearance,
  onOpenSubscription,
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
  const profileNickname = useProfileStore((s) => s.profile?.nickname ?? null);

  const { isSubscribed } = useSubscription();

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
            logOutAndWipeLocal().catch((e) =>
              Alert.alert(t("settings.account.signOutFailed"), String(e))
            );
          },
        },
      ]
    );
  };
  // 계정 라벨은 사용자가 온보딩에서 입력한 닉네임을 보여주고, 우측에 소셜 provider
  // 아이콘을 렌더한다. 소셜 로그인 이름(full_name)은 더 이상 노출하지 않는다.
  const provider = (authUser?.app_metadata?.provider as string | undefined) ?? null;
  const providerIcon = useMemo(() => {
    if (provider === "google") return <GoogleGIcon size={22} />;
    if (provider === "apple") {
      return <AppleLogoIcon size={20} color={theme.textPrimary} />;
    }
    return null;
  }, [provider, theme.textPrimary]);

  // 두 번째 단계: "그래도 삭제"를 누른 사용자에게 마지막 confirm을 띄운 뒤 실제 삭제.
  const confirmAndDelete = () => {
    Alert.alert(
      t("settings.account.deleteFinalConfirmTitle"),
      t("settings.account.deleteFinalConfirmBody"),
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

  const handleDeleteAccount = () => {
    // 활성 구독이 있으면 스토어에서 먼저 해지하라고 안내한다.
    // 탈퇴 자체를 막진 않는다 — App Store Review Guideline 5.1.1(v)는
    // 활성 구독을 이유로 계정 삭제를 차단하는 걸 허용하지 않는다.
    if (isSubscribed) {
      Alert.alert(
        t("settings.account.deleteSubscriptionWarningTitle"),
        t("settings.account.deleteSubscriptionWarningBody"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("settings.account.deleteAnyway"),
            style: "destructive",
            onPress: confirmAndDelete,
          },
          {
            text: t("settings.account.manageSubscription"),
            onPress: () => {
              openStoreSubscriptionManagement().catch(() =>
                Alert.alert(t("settings.account.storeOpenFailed"))
              );
            },
          },
        ]
      );
      return;
    }

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

  // 계정 행 라벨: 온보딩에서 사용자가 입력한 닉네임. 아직 없으면 이메일로 fallback.
  const accountLabel = profileNickname ?? authUser?.email ?? "";
  const accountSub = authUser?.email ?? "";

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
        <SubscriptionEntryCard
          theme={theme}
          isSubscribed={isSubscribed}
          onPress={onOpenSubscription}
          promoHeadline={t("settings.subscription.promoHeadline")}
          promoSub={t("settings.subscription.promoSub")}
          promoCta={t("settings.subscription.promoCta")}
          activeHeadline={t("settings.subscription.activeHeadline")}
          activeFeatures={t("settings.subscription.activeFeatures")}
          activeBadge={t("settings.subscription.activeBadge")}
        />

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
            rightSlot={
              providerIcon ? (
                <View style={styles.providerIconWrap}>{providerIcon}</View>
              ) : undefined
            }
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
          <ActionRow
            theme={theme}
            label={t("settings.mapAppearance.label")}
            sub={t("settings.mapAppearance.sub")}
            onPress={
              isSubscribed
                ? onOpenMapAppearance
                : onOpenSubscription
            }
            // 무료 사용자는 시각적으로 잠긴 상태 + PRO 뱃지, 누르면 구독 화면으로.
            // 유료 사용자는 평소처럼 바로 진입.
            locked={!isSubscribed}
            trailingBadge={
              !isSubscribed ? t("settings.mapAppearance.proBadge") : undefined
            }
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

        {isSubscribed && (
          <View style={[styles.card, styles.sectionLabelSpaced]}>
            <ActionRow
              theme={theme}
              label={t("settings.subscription.manageLabel")}
              sub={t("settings.subscription.manageSub")}
              onPress={() => {
                openStoreSubscriptionManagement().catch(() =>
                  Alert.alert(t("settings.account.storeOpenFailed"))
                );
              }}
            />
          </View>
        )}

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t("settings.section.legal")}
        </Text>
        <View style={styles.card}>
          <ActionRow
            theme={theme}
            label={t("subscription.legal.privacyPolicy")}
            onPress={() => {
              Linking.openURL(LEGAL_URLS.privacyPolicy).catch(() => {});
            }}
          />
          <ActionRow
            theme={theme}
            label={t("subscription.legal.termsOfUse")}
            onPress={() => {
              Linking.openURL(LEGAL_URLS.termsOfUse).catch(() => {});
            }}
            divider
          />
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
