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

import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";
import {
  LOCALE_LABELS,
  setAppLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../i18n";

type Props = {
  onClose: () => void;
};

export default function LanguageScreen({ onClose }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const currentLocale = (
    (SUPPORTED_LOCALES as readonly string[]).includes(i18n.language)
      ? i18n.language
      : "en"
  ) as SupportedLocale;

  const handleSelect = (locale: SupportedLocale) => {
    if (locale === currentLocale) return;
    setAppLocale(locale).catch((e) =>
      Alert.alert(t("settings.language.label"), String(e))
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.cancel}>{t("common.close")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("settings.language.label")}</Text>
        <View style={{ minWidth: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {SUPPORTED_LOCALES.map((loc, idx) => {
            const selected = loc === currentLocale;
            return (
              <Pressable
                key={loc}
                onPress={() => handleSelect(loc)}
                style={({ pressed }) => [
                  styles.row,
                  idx > 0 && styles.rowDivider,
                  pressed && { backgroundColor: theme.rowPressedBg },
                ]}
              >
                <Text style={styles.rowLabel}>{LOCALE_LABELS[loc]}</Text>
                {selected && <Text style={styles.check}>✓</Text>}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
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
      flex: 1,
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    check: {
      color: theme.accent,
      fontSize: 18,
      fontWeight: "700",
    },
  });
}
