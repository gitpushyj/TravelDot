import React, { useMemo, useState } from "react";
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import countries from "../../assets/data/countries.json";
import { getCurrentLocale } from "../i18n";
import { getCountryName } from "../lib/countryName";
import type { Theme } from "../theme/theme";
import { useTheme } from "../theme/themeStore";

type Entry = {
  code: string;
  name: string;
  nameKo: string;
  aliases?: string[];
};

type Props = {
  onSelect: (entry: Entry) => void;
  selectedCode?: string | null;
};

// UNWTO 기준 글로벌 출국 관광객 top5 (HK 제외, 단일 국가 기준) + KR
const POPULAR_CODES = ["KR", "CN", "DE", "US", "GB", "FR"] as const;

export default function CountryPicker({ onSelect, selectedCode }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [q, setQ] = useState("");

  const locale = getCurrentLocale();
  const sections = useMemo(() => {
    const list = (countries as Entry[])
      .slice()
      .sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"));
    const needle = q.trim().toLowerCase();

    if (needle) {
      const filtered = list.filter(
        (c) =>
          c.code.toLowerCase().includes(needle) ||
          c.name.toLowerCase().includes(needle) ||
          c.nameKo.toLowerCase().includes(needle) ||
          (c.aliases ?? []).some((a) => a.toLowerCase().includes(needle)) ||
          getCountryName(c.code, locale).toLowerCase().includes(needle) ||
          getCountryName(c.code, "en").toLowerCase().includes(needle)
      );
      return [{ key: "search", title: "", data: filtered }];
    }

    const byCode = new Map(list.map((c) => [c.code, c]));
    const popular = POPULAR_CODES.map((code) => byCode.get(code)).filter(
      (c): c is Entry => Boolean(c)
    );

    return [
      { key: "popular", title: t("countryPicker.popularSection"), data: popular },
      { key: "all", title: t("countryPicker.allSection"), data: list },
    ];
  }, [q, locale, t]);

  return (
    <View style={styles.root}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={t("countryPicker.searchPlaceholder")}
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.code}-${index}`}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const selected = item.code === selectedCode;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.row,
                selected && styles.rowSelected,
                pressed && styles.rowPressed,
              ]}
              onPress={() => onSelect(item)}
            >
              <Text style={styles.rowKo}>
                {getCountryName(item.code, locale)}
              </Text>
              <Text style={styles.rowMeta}>
                {item.name} · {item.code}
              </Text>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1 },
    input: {
      backgroundColor: theme.tabRowBg,
      color: theme.textPrimary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      marginBottom: 12,
    },
    sectionHeader: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.4,
      textTransform: "uppercase",
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 6,
    },
    row: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    rowSelected: {
      backgroundColor: theme.selectedRowBg,
    },
    rowPressed: {
      backgroundColor: theme.rowPressedBg,
    },
    rowKo: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    rowMeta: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: theme.cardBorder },
  });
}
