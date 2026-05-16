import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { VisitNote } from "../../features/travel/visitRepository";
import { useTheme } from "../../theme/themeStore";

import { formatDateLong } from "./format";

type Props = {
  note: VisitNote | null;
  onEdit: () => void;
};

export default function NoteCard({ note, onEdit }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (note == null) {
    return (
      <Pressable
        onPress={onEdit}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t("tripDetail.noteSection")}</Text>
        </View>
        <Text style={styles.placeholder}>
          {t("tripDetail.notePlaceholder")}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("tripDetail.noteSection")}</Text>
        <Text style={styles.date}>
          {t("tripDetail.noteWritten", { date: formatDateLong(note.date) })}
        </Text>
      </View>
      <Text style={styles.body}>{note.body}</Text>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 18,
      gap: 12,
    },
    cardPressed: {
      opacity: 0.85,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    date: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    body: {
      color: theme.textPrimary,
      fontSize: 14,
      lineHeight: 22,
    },
    placeholder: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 22,
    },
  });
}
