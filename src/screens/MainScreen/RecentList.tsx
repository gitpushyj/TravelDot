import { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { RecentTrip } from "../../features/travel/visitRepository";
import { getCurrentLocale } from "../../i18n";
import { getCountryName } from "../../lib/countryName";
import type { Theme } from "../../theme/theme";
import { flagEmoji } from "../../utils/flag";
import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  trips: RecentTrip[];
  onSelect: (trip: RecentTrip) => void;
};

export default function RecentList({ theme, trips, onSelect }: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  if (trips.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>{t("home.emptyTrips")}</Text>
      </View>
    );
  }
  const display = trips.slice(0, 5);
  return (
    <FlatList
      data={display}
      keyExtractor={(trip) => `${trip.countryCode}-${trip.startDate}`}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.rowSep} />}
      renderItem={({ item, index }) => {
        const koName = getCountryName(item.countryCode, getCurrentLocale());
        const [y, m, d] = item.startDate.split("-");
        return (
          <Pressable
            onPress={() => onSelect(item)}
            style={({ pressed }) => [
              styles.recentRow,
              pressed && { backgroundColor: theme.rowPressedBg },
            ]}
          >
            <View style={styles.flagBox}>
              <Text style={styles.flagText}>{flagEmoji(item.countryCode)}</Text>
            </View>
            <View style={styles.recentMain}>
              <View style={styles.recentTitleRow}>
                <Text style={styles.recentName}>{koName}</Text>
                <Text style={styles.recentCode}> {item.countryCode}</Text>
                {index === 0 && (
                  <View style={styles.recentBadge}>
                    <Text style={styles.recentBadgeText}>
                      {t("home.tripRecent")}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.recentDate}>
                {t("home.tripDuration", { y, m, d, days: item.days })}
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        );
      }}
    />
  );
}
