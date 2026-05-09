import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { TripWithPhotos } from "../../features/travel/visitRepository";
import { getCurrentLocale } from "../../i18n";
import { getCountryName } from "../../lib/countryName";
import type { Theme } from "../../theme/theme";
import { flagBoxBgFor } from "../../utils/countryColors";
import { flagEmoji } from "../../utils/flag";
import { formatTripDateRange } from "../../utils/tripFormat";

import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  trip: TripWithPhotos;
  showMergeHint: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onMergeHintPress: () => void;
};

export default function TripRow({
  theme,
  trip,
  showMergeHint,
  onPress,
  onLongPress,
  onMergeHintPress,
}: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const koName = getCountryName(trip.countryCode, getCurrentLocale());
  const flagBg = flagBoxBgFor(trip.countryCode);
  const dateLabel = `${formatTripDateRange(trip.startDate, trip.endDate)} ${t("common.daysSuffix", { count: trip.days })}`;
  return (
    <View style={styles.rowWrap}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.row,
          pressed && { backgroundColor: theme.rowPressedBg },
        ]}
      >
        <View
          style={[
            styles.flagBox,
            flagBg ? { backgroundColor: flagBg } : null,
          ]}
        >
          <Text style={styles.flagText}>{flagEmoji(trip.countryCode)}</Text>
        </View>
        <View style={styles.rowMain}>
          <View style={styles.titleRow}>
            <Text style={styles.rowName}>{koName}</Text>
            <Text style={styles.rowCode}> {trip.countryCode}</Text>
          </View>
          <Text style={styles.rowSub}>{dateLabel}</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </Pressable>
      {showMergeHint && (
        <Pressable onPress={onMergeHintPress} style={styles.hintRow}>
          <View style={styles.hintDivider} />
          <Text style={styles.hintText}>{t("history.mergeHint")}</Text>
        </Pressable>
      )}
    </View>
  );
}
