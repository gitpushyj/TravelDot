import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import countries from "../../assets/data/countries.json";

type Entry = { code: string; name: string; nameKo: string };

type Props = {
  onSelect: (entry: Entry) => void;
  selectedCode?: string | null;
};

export default function CountryPicker({ onSelect, selectedCode }: Props) {
  const [q, setQ] = useState("");

  const data = useMemo(() => {
    const list = countries as Entry[];
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter(
      (c) =>
        c.code.toLowerCase().includes(needle) ||
        c.name.toLowerCase().includes(needle) ||
        c.nameKo.toLowerCase().includes(needle)
    );
  }, [q]);

  return (
    <View style={styles.root}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="국가 검색 (한글/영문/코드)"
        placeholderTextColor="#5b6680"
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <FlatList
        data={data}
        keyExtractor={(item) => item.code}
        keyboardShouldPersistTaps="handled"
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
              <Text style={styles.rowKo}>{item.nameKo}</Text>
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  input: {
    backgroundColor: "#1c2942",
    color: "#e8eefc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  rowSelected: {
    backgroundColor: "#1c2942",
  },
  rowPressed: {
    backgroundColor: "#22304d",
  },
  rowKo: {
    color: "#e8eefc",
    fontSize: 15,
    fontWeight: "600",
  },
  rowMeta: {
    color: "#7d8aa6",
    fontSize: 12,
    marginTop: 2,
  },
  sep: { height: 1, backgroundColor: "#152037" },
});
