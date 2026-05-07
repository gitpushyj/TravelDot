import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { TripWithPhotos } from "../../features/travel/visitRepository";
import { KO_NAME_BY_CODE } from "../../lib/countryLookup";
import type { Theme } from "../../theme/theme";
import { flagEmoji } from "../../utils/flag";

import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  trip: TripWithPhotos;
  onPress: () => void;
};

export default function TripRow({ theme, trip, onPress }: Props) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const koName = KO_NAME_BY_CODE[trip.countryCode] ?? trip.countryCode;
  const [y, m, d] = trip.startDate.split("-");
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: theme.rowPressedBg },
      ]}
    >
      <View style={styles.flagBox}>
        <Text style={styles.flagText}>{flagEmoji(trip.countryCode)}</Text>
      </View>
      <View style={styles.rowMain}>
        <View style={styles.titleRow}>
          <Text style={styles.rowName}>{koName}</Text>
          <Text style={styles.rowCode}> {trip.countryCode}</Text>
        </View>
        <Text style={styles.rowSub}>{trip.days}일 여행</Text>
      </View>
      <Text style={styles.rowDate}>
        {y} · {m} · {d}
      </Text>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}
