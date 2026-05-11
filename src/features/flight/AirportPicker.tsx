import { useMemo, useState } from "react";
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

import { searchAirports } from "./airports";
import type { Airport } from "./airports";

type Props = {
  visible: boolean;
  title: string;
  onSelect: (a: Airport) => void;
  onClose: () => void;
};

export default function AirportPicker({ visible, title, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchAirports(query, 60), [query]);

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
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder={t("flight.searchPlaceholder")}
          placeholderTextColor={theme.textSecondary}
          style={styles.input}
        />
        {query.trim().length === 0 ? (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>
              {t("flight.searchHint")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(a) => a.iata}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
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

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.cardBg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
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
