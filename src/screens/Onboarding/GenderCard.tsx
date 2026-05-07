import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Gender } from "../../features/onboarding/profileStore";
import { useTheme } from "../../theme/themeStore";

import { GenderIcon } from "./genderIcons";

const GENDERS: Gender[] = ["male", "female", "other", "prefer_not_to_say"];

type Props = {
  value: Gender | null;
  onChange: (g: Gender) => void;
};

export default function GenderCard({ value, onChange }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{t("onboarding.gender.title")}</Text>
      <View style={styles.grid}>
        {GENDERS.map((g) => {
          const selected = value === g;
          const iconColor = selected ? theme.accent : theme.textMuted;
          return (
            <Pressable
              key={g}
              onPress={() => onChange(g)}
              style={({ pressed }) => [
                styles.btn,
                selected && styles.btnSelected,
                pressed && !selected && styles.btnPressed,
              ]}
            >
              <GenderIcon gender={g} color={iconColor} size={20} />
              <Text
                style={[styles.btnText, selected && styles.btnTextSelected]}
              >
                {t(`onboarding.gender.options.${g}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: 18,
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    cardLabel: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 12,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    btn: {
      flexGrow: 1,
      flexBasis: "47%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: theme.optionBtnBg,
      borderWidth: 1.5,
      borderColor: theme.optionBtnBorder,
    },
    btnSelected: {
      backgroundColor: theme.accentSoftBg,
      borderColor: theme.accent,
    },
    btnPressed: {
      backgroundColor: theme.optionBtnPressedBg,
    },
    btnText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "700",
    },
    btnTextSelected: {
      color: theme.accent,
    },
  });
}
