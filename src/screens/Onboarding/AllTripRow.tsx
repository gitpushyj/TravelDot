import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { getCurrentLocale } from "../../i18n";
import { getCountryName } from "../../lib/countryName";
import type { Theme } from "../../theme/theme";
import { flagEmoji } from "../../utils/flag";

type Props = {
  theme: Theme;
  countryCode: string;
  startDate: string;
  endDate: string;
  days: number;
  photoCount: number;
  previewUris: string[];
  onReject: () => void;
};

export default function AllTripRow({
  theme,
  countryCode,
  startDate,
  endDate,
  days,
  photoCount,
  previewUris,
  onReject,
}: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const name = getCountryName(countryCode, getCurrentLocale());
  const remainingPhotos = Math.max(0, photoCount - previewUris.length);

  return (
    <Animated.View style={styles.row} exiting={FadeOut.duration(260)}>
      <View style={styles.rowMain}>
        <Text style={styles.flagText}>{flagEmoji(countryCode)}</Text>
        <View style={styles.rowText}>
          <View style={styles.rowTitleLine}>
            <Text style={styles.rowName}>{name}</Text>
            <Text style={styles.rowCode}> {countryCode}</Text>
          </View>
          <Text style={styles.rowDate}>
            {t("onboarding.allTrips.rowMeta", {
              range: formatRange(startDate, endDate),
              days,
            })}
          </Text>
          <Text style={styles.rowMeta}>
            {t("onboarding.allTrips.rowPhotoLine", { count: photoCount })}
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
            styles.rejectBtn,
            pressed && styles.actionBtnPressed,
          ]}
        >
          <Text style={styles.rejectBtnIcon}>✕</Text>
          <Text style={styles.rejectBtnText}>
            {t("onboarding.allTrips.actionReject")}
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

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      backgroundColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      gap: 12,
    },
    rowMain: {
      flexDirection: "row",
      gap: 12,
    },
    flagText: {
      fontSize: 28,
      lineHeight: 32,
    },
    rowText: {
      flex: 1,
    },
    rowTitleLine: {
      flexDirection: "row",
      alignItems: "baseline",
    },
    rowName: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    rowCode: {
      fontSize: 12,
      color: theme.textMuted,
    },
    rowDate: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    rowMeta: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    thumbRow: {
      flexDirection: "row",
      gap: 6,
    },
    thumbWrap: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 8,
      overflow: "hidden",
      position: "relative",
    },
    thumb: {
      width: "100%",
      height: "100%",
    },
    thumbOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    thumbOverlayText: {
      color: "#ffffff",
      fontWeight: "700",
      fontSize: 14,
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    rejectBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: theme.dangerBg,
    },
    actionBtnPressed: {
      opacity: 0.7,
    },
    rejectBtnIcon: {
      color: theme.dangerOn,
      fontWeight: "700",
      fontSize: 13,
    },
    rejectBtnText: {
      color: theme.dangerOn,
      fontWeight: "700",
      fontSize: 13,
    },
  });
}
