import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

export type SortKey = "recent" | "days" | "az";

const SORT_KEYS: SortKey[] = ["recent", "days", "az"];
const SORT_I18N: Record<SortKey, string> = {
  recent: "history.sortRecent",
  days: "history.sortDays",
  az: "history.sortAz",
};

type Props = {
  theme: Theme;
  value: SortKey;
  onChange: (s: SortKey) => void;
};

export default function SortTabs({ theme, value, onChange }: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.sortRow}>
      {SORT_KEYS.map((key) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
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
              {t(SORT_I18N[key])}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
