import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useVisitStore } from "../features/travel/visitStore";
import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";

type Props = { onClose: () => void };

export default function CountryDetailScreen({ onClose }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const selectedCountry = useVisitStore((s) => s.selectedCountry);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.headerSide}>
          <Text style={styles.cancel}>닫기</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {selectedCountry?.name ?? ""}
        </Text>
        <View style={styles.headerSide} />
      </View>
      <View style={styles.content} />
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 56,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerSide: { minWidth: 40 },
    title: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
    cancel: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: "600",
    },
    content: {
      flex: 1,
    },
  });
}
