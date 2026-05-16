import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";
import type { CountryColor } from "../../utils/countryColors";
import { formatTripDateRange } from "../../utils/tripFormat";

import { CalendarIcon } from "./icons";

type Props = {
  startDate: string;
  endDate: string;
  days: number;
  countryColor: CountryColor;
};

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function DateRangeCard({
  startDate,
  endDate,
  days,
  countryColor,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const iconBg = hexToRgba(countryColor.bg, 0.1);

  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <CalendarIcon size={22} color={countryColor.bg} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.label}>{t("tripDetail.sectionDates")}</Text>
        <View style={styles.dateLine}>
          <Text style={styles.dateText}>
            {formatTripDateRange(startDate, endDate)}
          </Text>
          <Text style={styles.daysText}>
            {" "}
            {t("common.daysSuffix", { count: days })}
          </Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingVertical: 16,
      paddingHorizontal: 16,
      gap: 14,
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    textCol: {
      flex: 1,
      gap: 4,
    },
    label: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    dateLine: {
      flexDirection: "row",
      alignItems: "baseline",
      flexWrap: "wrap",
    },
    dateText: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    daysText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
  });
}
