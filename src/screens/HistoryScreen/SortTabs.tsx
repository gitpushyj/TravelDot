import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

export type SortKey = "recent" | "days" | "az";

export const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "최근순" },
  { key: "days", label: "체류일순" },
  { key: "az", label: "A-Z" },
];

type Props = {
  theme: Theme;
  value: SortKey;
  onChange: (s: SortKey) => void;
};

export default function SortTabs({ theme, value, onChange }: Props) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.sortRow}>
      {SORT_TABS.map((t) => {
        const active = t.key === value;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={({ pressed }) => [
              styles.sortChip,
              active && styles.sortChipActive,
              pressed && !active && styles.sortChipPressed,
            ]}
          >
            <Text
              style={[
                styles.sortChipText,
                active && styles.sortChipTextActive,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
