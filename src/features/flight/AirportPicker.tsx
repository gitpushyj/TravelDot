import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { getCountryName } from "../../lib/countryName";
import { getCurrentLocale } from "../../i18n";
import { useTheme } from "../../theme/themeStore";
import type { Theme } from "../../theme/theme";

import { getAirportByIata, searchAirports } from "./airports";
import type { Airport } from "./airports";
import {
  POPULAR_ARRIVAL_IATAS,
  POPULAR_DEPARTURE_IATAS,
} from "./popularAirports";

type Props = {
  visible: boolean;
  title: string;
  // 출발/도착 중 어느 쪽 picker인지. 검색어가 비어 있을 때 보여 줄 추천 리스트가
  // 출발이면 "전체 승객 교통량 top 10", 도착이면 "국제선 승객 교통량 top 10"으로 다르다.
  side: "origin" | "destination";
  onSelect: (a: Airport) => void;
  onClose: () => void;
};

export default function AirportPicker({
  visible,
  title,
  side,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [query, setQuery] = useState("");

  // Picker가 열릴 때 이전 검색어를 비운다. visible toggle만으로 사용해 컴포넌트가
  // unmount되지 않으므로 query state가 그대로 남아, 출발 검색 후 도착 picker를 열면
  // 이전 검색어가 그대로 보이는 버그가 있었음.
  useEffect(() => {
    if (visible) setQuery("");
  }, [visible]);

  const results = useMemo(() => searchAirports(query, 60), [query]);

  // 추천 공항 — 검색어가 비어 있을 때만 표시. side에 따라 다른 리스트.
  const popularAirports = useMemo(() => {
    const codes =
      side === "origin" ? POPULAR_DEPARTURE_IATAS : POPULAR_ARRIVAL_IATAS;
    return codes
      .map((c) => getAirportByIata(c))
      .filter((a): a is Airport => a != null);
  }, [side]);

  const popularLabel =
    side === "origin"
      ? t("flight.popularDepartures")
      : t("flight.popularArrivals");

  const showPopular = query.trim().length === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("flight.searchPlaceholder")}
          placeholderTextColor={theme.textSecondary}
          style={styles.input}
        />
        {showPopular ? (
          <FlatList
            data={popularAirports}
            keyExtractor={(a) => a.iata}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Text style={styles.sectionLabel}>{popularLabel}</Text>
            }
            renderItem={({ item }) => (
              <AirportRow item={item} onSelect={onSelect} styles={styles} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyHint}>
                <Text style={styles.emptyHintText}>
                  {t("flight.searchHint")}
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(a) => a.iata}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <AirportRow item={item} onSelect={onSelect} styles={styles} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyHint}>
                <Text style={styles.emptyHintText}>
                  {t("flight.searchEmpty")}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function AirportRow({
  item,
  onSelect,
  styles,
}: {
  item: Airport;
  onSelect: (a: Airport) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable
      onPress={() => onSelect(item)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.iata}>{item.iata}</Text>
      <View style={styles.rowMain}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.city}
          {", "}
          {getCountryName(item.country, getCurrentLocale())}
        </Text>
      </View>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.cardBg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.cardBorder,
    },
    title: { color: theme.textPrimary, fontSize: 18, fontWeight: "700" },
    closeBtn: { padding: 4 },
    closeIcon: { color: theme.textPrimary, fontSize: 18, fontWeight: "700" },
    input: {
      margin: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.optionBtnBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.cardBorder,
      color: theme.textPrimary,
      fontSize: 16,
    },
    sectionLabel: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 8,
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.4,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.cardBorder,
    },
    rowPressed: { backgroundColor: theme.optionBtnPressedBg },
    iata: {
      width: 56,
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 1.2,
    },
    rowMain: { flex: 1 },
    name: { color: theme.textPrimary, fontSize: 15, fontWeight: "600" },
    sub: { color: theme.textSecondary, fontSize: 13, marginTop: 2 },
    emptyHint: { paddingHorizontal: 24, paddingVertical: 32, alignItems: "center" },
    emptyHintText: { color: theme.textSecondary, fontSize: 14, textAlign: "center" },
  });
}
