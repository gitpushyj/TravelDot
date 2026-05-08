import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { TripWithPhotos } from "../../features/travel/visitRepository";
import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  trip: TripWithPhotos;
  selected: boolean;
  onToggle: () => void;
};

function formatMD(date: string): string {
  const [, m, d] = date.split("-");
  return `${m}.${d}`;
}

export default function TripCheckRow({
  theme,
  trip,
  selected,
  onToggle,
}: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const range =
    trip.startDate === trip.endDate
      ? formatMD(trip.startDate)
      : `${formatMD(trip.startDate)} — ${formatMD(trip.endDate)}`;
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.checkRow, selected && styles.checkRowSelected]}
    >
      <View style={[styles.checkbox, selected && styles.checkboxOn]}>
        {selected && <Text style={styles.checkboxMark}>✓</Text>}
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowDate}>{range}</Text>
        <Text style={styles.rowSub}>
          {t("countryDetail.tripDuration", { days: trip.days })}
          {trip.photos > 0
            ? ` · ${t("countryDetail.tripPhotos", { count: trip.photos })}`
            : ""}
        </Text>
      </View>
    </Pressable>
  );
}
