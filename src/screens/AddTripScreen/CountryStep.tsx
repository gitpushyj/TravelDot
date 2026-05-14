import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import countries from "../../../assets/data/countries.json";
import { useVisitStore } from "../../features/travel/visitStore";
import { getCurrentLocale } from "../../i18n";
import { getCountryName } from "../../lib/countryName";
import type { Theme } from "../../theme/theme";
import { colorForCountry } from "../../utils/countryColors";
import { flagEmoji } from "../../utils/flag";

import type { AddTripStyles } from "./styles";

type Entry = {
  code: string;
  name: string;
  nameKo: string;
  aliases?: string[];
};

type Props = {
  styles: AddTripStyles;
  theme: Theme;
  selectedCode: string | null;
  onSelect: (entry: { code: string; name: string }) => void;
  onClear: () => void;
};

type Section =
  | { kind: "header"; key: string; label: string }
  | { kind: "country"; key: string; entry: Entry };

export default function CountryStep({
  styles,
  theme,
  selectedCode,
  onSelect,
  onClear,
}: Props) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const visitCounts = useVisitStore((s) => s.visitCounts);
  const homeCode = useVisitStore((s) => s.homeCountry?.code ?? null);

  const locale = getCurrentLocale();
  const allCountries = useMemo(
    () =>
      (countries as Entry[])
        .slice()
        .sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko")),
    []
  );

  const filtered = useMemo(() => {
    if (!q.trim()) return allCountries;
    const needle = q.trim().toLowerCase();
    return allCountries.filter(
      (c) =>
        c.code.toLowerCase().includes(needle) ||
        c.name.toLowerCase().includes(needle) ||
        c.nameKo.toLowerCase().includes(needle) ||
        (c.aliases ?? []).some((a) => a.toLowerCase().includes(needle)) ||
        getCountryName(c.code, locale).toLowerCase().includes(needle) ||
        getCountryName(c.code, "en").toLowerCase().includes(needle)
    );
  }, [q, allCountries, locale]);

  const sections = useMemo<Section[]>(() => {
    const out: Section[] = [];
    if (!q.trim()) {
      const visitedCodes = Object.keys(visitCounts).filter(
        (c) => visitCounts[c] > 0
      );
      const visitedSet = new Set(visitedCodes);
      const visitedEntries = filtered.filter((c) => visitedSet.has(c.code));
      // 본국이 visit_counts에 들어있을 수도 있고 아닐 수도 있다 — visitedSet만 신뢰.
      visitedEntries.sort(
        (a, b) => (visitCounts[b.code] ?? 0) - (visitCounts[a.code] ?? 0)
      );
      if (visitedEntries.length > 0) {
        out.push({
          kind: "header",
          key: "h-visited",
          label: t("addTrip.sectionVisited"),
        });
        for (const e of visitedEntries) {
          out.push({ kind: "country", key: `v-${e.code}`, entry: e });
        }
        out.push({
          kind: "header",
          key: "h-all",
          label: t("addTrip.sectionAll"),
        });
        for (const e of filtered.filter((c) => !visitedSet.has(c.code))) {
          out.push({ kind: "country", key: `a-${e.code}`, entry: e });
        }
        return out;
      }
    }
    for (const e of filtered) {
      out.push({ kind: "country", key: `r-${e.code}`, entry: e });
    }
    return out;
  }, [filtered, visitCounts, q, t]);

  return (
    <View style={styles.body}>
      <View style={{ paddingHorizontal: 20, gap: 16 }}>
        <View style={styles.stepHeading}>
          <Text style={styles.stepTitle}>{t("addTrip.step1Title")}</Text>
          <Text style={styles.stepSubtitle}>{t("addTrip.step1Subtitle")}</Text>
        </View>

        {selectedCode && (
          <View
            style={[
              styles.selectedCard,
              { backgroundColor: colorForCountry(selectedCode).bg },
            ]}
          >
            <Text style={styles.selectedFlag}>{flagEmoji(selectedCode)}</Text>
            <View style={styles.selectedNameCol}>
              <Text style={[styles.selectedName, { color: "#fff" }]}>
                {getCountryName(selectedCode, locale)}
              </Text>
              <Text
                style={[styles.selectedCode, { color: "rgba(255,255,255,0.75)" }]}
              >
                {selectedCode}
              </Text>
            </View>
            <Pressable
              onPress={onClear}
              hitSlop={6}
              style={({ pressed }) => [
                styles.clearBtn,
                {
                  backgroundColor: pressed
                    ? "rgba(255,255,255,0.28)"
                    : "rgba(255,255,255,0.18)",
                },
              ]}
            >
              <Text style={[styles.clearBtnText, { color: "#fff" }]}>
                {t("addTrip.changeAction")}
              </Text>
            </Pressable>
          </View>
        )}

        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t("countryPicker.searchPlaceholder")}
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        style={{ flex: 1, marginTop: 8 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        data={sections}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => {
          if (item.kind === "header") {
            return <Text style={styles.sectionHeader}>{item.label}</Text>;
          }
          const e = item.entry;
          const selected = selectedCode === e.code;
          const isHome = homeCode === e.code;
          const visitCount = visitCounts[e.code] ?? 0;
          return (
            <Pressable
              onPress={() => onSelect({ code: e.code, name: e.nameKo })}
              style={({ pressed }) => [
                styles.countryRow,
                selected && styles.countryRowSelected,
                pressed && !selected && styles.countryRowPressed,
              ]}
            >
              <Text style={styles.countryFlag}>{flagEmoji(e.code)}</Text>
              <View style={styles.countryNameCol}>
                <Text style={styles.countryName}>
                  {getCountryName(e.code, locale)}
                </Text>
                <Text style={styles.countryMeta}>
                  {e.name} · {e.code}
                </Text>
              </View>
              {isHome ? (
                <View style={styles.visitedPill}>
                  <Text style={styles.visitedPillText}>
                    {t("addTrip.homeBadge")}
                  </Text>
                </View>
              ) : visitCount > 0 ? (
                <View style={styles.visitedPill}>
                  <Text style={styles.visitedPillText}>
                    {t("addTrip.visitedBadge", { count: visitCount })}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.listEmpty}>{t("allCountries.empty")}</Text>
        }
      />
    </View>
  );
}
