import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import {
  runFullSync,
  runIncrementalSync,
} from "../features/photoSync/syncService";
import { useTheme, useThemeStore } from "../theme/themeStore";
import type { Theme, ThemeMode } from "../theme/theme";
import { useAuthStore } from "../features/auth/authStore";
import { pickActiveBadge, useBadgeStore } from "../features/badges/badgeStore";
import { COUNTRY_NAME_KO_BY_CODE } from "../features/badges/countryNames";
import { useVisitStore } from "../features/travel/visitStore";
import { getTierByCount } from "../features/travel/tierTitles";
import {
  LOCALE_LABELS,
  setAppLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../i18n";

type Props = {
  onClose: () => void;
  onAddTrip: () => void;
  onOpenTitles: () => void;
  onChangeHome: () => void;
  onReviewSuspect: () => void;
};

const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];

export default function SettingsScreen({
  onClose,
  onAddTrip,
  onOpenTitles,
  onChangeHome,
  onReviewSuspect,
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
          title: activeBadge.titleKo,
        })
      : t("settings.title.preview", {
          emoji: activeBadge.emoji,
          title: activeBadge.titleKo,
        })
    : t("settings.title.none");

  const currentLocale = (
    (SUPPORTED_LOCALES as readonly string[]).includes(i18n.language)
      ? i18n.language
      : "en"
  ) as SupportedLocale;

  const openLanguagePicker = () => {
    const buttons = SUPPORTED_LOCALES.map((loc) => ({
      text: LOCALE_LABELS[loc] + (loc === currentLocale ? "  ✓" : ""),
      onPress: () => {
        if (loc !== currentLocale) void setAppLocale(loc);
      },
    }));
    buttons.push({
      text: t("common.cancel"),
      style: "cancel",
      onPress: () => {},
    } as any);
    Alert.alert(t("settings.language.label"), undefined, buttons);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.cancel}>{t("common.close")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("settings.title")}</Text>
        <View style={{ minWidth: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>{t("settings.section.account")}</Text>
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
            onPress={openLanguagePicker}
          />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t("settings.section.theme")}
        </Text>
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
      </ScrollView>
    </View>
  );
}

function ActionRow({
  theme,
  label,
  sub,
  onPress,
  divider,
  disabled,
}: {
  theme: Theme;
  label: string;
  sub: string;
  onPress: () => void;
  divider?: boolean;
  disabled?: boolean;
}) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        divider && styles.rowDivider,
        !disabled && pressed && { backgroundColor: theme.rowPressedBg },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      {!disabled && <Text style={styles.chev}>›</Text>}
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 56,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
    cancel: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: "600",
      minWidth: 40,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 40,
    },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      marginBottom: 8,
      marginLeft: 4,
      textTransform: "uppercase",
    },
    sectionLabelSpaced: {
      marginTop: 24,
    },
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.cardBorder,
    },
    rowLabel: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    rowSub: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: theme.tabRowBg,
      borderRadius: 999,
      padding: 4,
      gap: 4,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentItemActive: {
      backgroundColor: theme.cardBg,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 1,
    },
    segmentText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    segmentTextActive: {
      color: theme.textPrimary,
      fontWeight: "700",
    },
    chev: {
      color: theme.textMuted,
      fontSize: 22,
      fontWeight: "400",
    },
  });
}
