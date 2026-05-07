import React, { useMemo } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";

import type { SuspectTrip } from "../../features/photoSync/deviceVerification";
import { KO_NAME_BY_CODE } from "../../lib/countryLookup";
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
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const koName = KO_NAME_BY_CODE[trip.countryCode] ?? trip.countryCode;
  const deviceText =
    trip.deviceLabels.length === 0
      ? "다른 기기"
      : trip.deviceLabels.length === 1
        ? trip.deviceLabels[0]
        : `${trip.deviceLabels[0]} 외 ${trip.deviceLabels.length - 1}대`;
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
            {formatRange(trip.startDate, trip.endDate)} · {trip.days}일
          </Text>
          <Text style={styles.rowMeta}>
            사진 {trip.photoCount}장 · {deviceText}
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
          <Text style={styles.rejectBtnText}>제거</Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.acceptBtn,
            pressed && styles.actionBtnPressed,
          ]}
        >
          <Text style={styles.acceptBtnText}>내 여행에 추가</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function formatRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return startDate;
  return `${startDate} ~ ${endDate}`;
}
