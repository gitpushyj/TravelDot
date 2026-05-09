import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

export type TitleFilter = "all" | "unlocked";

type Props = {
  theme: Theme;
  value: TitleFilter;
  onChange: (next: TitleFilter) => void;
};

const OPTIONS: { value: TitleFilter; i18nKey: string }[] = [
  { value: "all", i18nKey: "titles.filter.all" },
  { value: "unlocked", i18nKey: "titles.filter.unlocked" },
];

export default function TitleFilterTabs({ theme, value, onChange }: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.filterTabs}>
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.filterTab,
              active && styles.filterTabActive,
              pressed && !active && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                active && styles.filterTabTextActive,
              ]}
            >
              {t(opt.i18nKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
