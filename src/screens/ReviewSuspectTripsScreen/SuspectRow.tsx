import React, { useMemo } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import type { SuspectTrip } from "../../features/photoSync/deviceVerification";
import { getCurrentLocale } from "../../i18n";
import { getCountryName } from "../../lib/countryName";
import type { Theme } from "../../theme/theme";
import { flagEmoji } from "../../utils/flag";

import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  trip: SuspectTrip;
  previewUris: string[];
  onReject: () => void;
  onAccept: () => void;
};

export default function SuspectRow({
  theme,
  trip,
  previewUris,
  onReject,
  onAccept,
}: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const koName = getCountryName(trip.countryCode, getCurrentLocale());
  const deviceText =
    trip.deviceLabels.length === 0
      ? t("reviewSuspect.deviceFallback")
      : trip.deviceLabels.length === 1
        ? trip.deviceLabels[0]
        : t("reviewSuspect.deviceMore", {
            first: trip.deviceLabels[0],
            count: trip.deviceLabels.length - 1,
          });
  const remainingPhotos = Math.max(0, trip.photoCount - previewUris.length);

  return (
    <Animated.View style={styles.row} exiting={FadeOut.duration(260)}>
      <View style={styles.rowMain}>
        <Text style={styles.flagText}>{flagEmoji(trip.countryCode)}</Text>
        <View style={styles.rowText}>
          <View style={styles.rowTitleLine}>
            <Text style={styles.rowName}>{koName}</Text>
            <Text style={styles.rowCode}> {trip.countryCode}</Text>
          </View>
          <Text style={styles.rowDate}>
            {t("reviewSuspect.rowMeta", {
              range: formatRange(trip.startDate, trip.endDate),
              days: trip.days,
            })}
          </Text>
          <Text style={styles.rowMeta}>
            {t("reviewSuspect.rowPhotoLine", {
              count: trip.photoCount,
              devices: deviceText,
            })}
          </Text>
        </View>
      </View>
      {previewUris.length > 0 && (
        <View style={styles.thumbRow}>
          {previewUris.map((uri, idx) => (
            <View key={`${uri}-${idx}`} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              {idx === previewUris.length - 1 && remainingPhotos > 0 && (
                <View style={styles.thumbOverlay}>
                  <Text style={styles.thumbOverlayText}>
                    +{remainingPhotos}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
      <View style={styles.actionRow}>
        <Pressable
          onPress={onReject}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.rejectBtn,
            pressed && styles.actionBtnPressed,
          ]}
        >
          <Text style={styles.rejectBtnIcon}>✕</Text>
          <Text style={styles.rejectBtnText}>{t("common.remove")}</Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.acceptBtn,
            pressed && styles.actionBtnPressed,
          ]}
        >
          <Text style={styles.acceptBtnText}>
            {t("reviewSuspect.actionAccept")}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function formatRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return startDate;
  return `${startDate} ~ ${endDate}`;
}
