import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { TripWithPhotos } from "../../features/travel/visitRepository";
import type { Theme } from "../../theme/theme";
import { formatTripDateRange } from "../../utils/tripFormat";

import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  trip: TripWithPhotos;
  selected: boolean;
  onToggle: () => void;
};

export default function TripCheckRow({
  theme,
  trip,
  selected,
  onToggle,
}: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const dateLabel = `${formatTripDateRange(trip.startDate, trip.endDate)} ${t("common.daysSuffix", { count: trip.days })}`;
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.checkRow, selected && styles.checkRowSelected]}
    >
      <View style={[styles.checkbox, selected && styles.checkboxOn]}>
        {selected && <Text style={styles.checkboxMark}>✓</Text>}
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowDate}>{dateLabel}</Text>
        {trip.photos > 0 && (
          <Text style={styles.rowSub}>
            {t("countryDetail.tripPhotos", { count: trip.photos })}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
