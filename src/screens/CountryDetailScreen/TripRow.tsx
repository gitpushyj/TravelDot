import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { useTranslation } from "react-i18next";

import type { TripWithPhotos } from "../../features/travel/visitRepository";
import type { Theme } from "../../theme/theme";
import { colorForCountry } from "../../utils/countryColors";

import { makeStyles } from "./styles";
import { formatMD } from "./utils";

type Props = {
  theme: Theme;
  trip: TripWithPhotos;
  showRecent: boolean;
  editMode: boolean;
  onPress: () => void;
  onDelete: () => void;
};

export default function TripRow({
  theme,
  trip,
  showRecent,
  editMode,
  onPress,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const countryColor = colorForCountry(trip.countryCode);

  // iOS 편집 모드의 잔잔한 흔들림. 항목별로 위상 차이를 줘서 한꺼번에 같은
  // 방향으로 흔들리지 않도록 한다. 휴식 상태(0)에서 0deg가 되도록 입력을
  // -1..1로 둬서 양방향 대칭 흔들림을 만든다.
  const wiggle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!editMode) {
      wiggle.stopAnimation();
      wiggle.setValue(0);
      return;
    }
    let h = 0;
    for (let i = 0; i < trip.startDate.length; i += 1) {
      h = (h * 31 + trip.startDate.charCodeAt(i)) >>> 0;
    }
    // 항목별 시작 위상을 -1..1 범위에서 균등 분포시킨다.
    const phase = ((h % 100) / 100) * 2 - 1;
    wiggle.setValue(phase);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, {
          toValue: 1,
          duration: 140,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: -1,
          duration: 140,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [editMode, wiggle, trip.startDate]);

  const rotate = wiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-1.2deg", "0deg", "1.2deg"],
  });

  const content = (
    <Pressable
      onPress={editMode ? undefined : onPress}
      style={({ pressed }) => [
        styles.tripCard,
        !editMode && pressed && { backgroundColor: theme.rowPressedBg },
      ]}
    >
      <View style={[styles.tripThumb, { backgroundColor: countryColor.bg }]}>
        <View
          style={[styles.tripThumbInner, { backgroundColor: countryColor.dot }]}
        />
        <View style={styles.tripThumbBadge}>
          <Text style={styles.tripThumbBadgeText}>
            {t("countryDetail.tripPhotos", { count: trip.photos })}
          </Text>
        </View>
      </View>
      <View style={styles.tripBody}>
        <View style={styles.tripTitleRow}>
          <Text style={styles.tripDate}>
            {formatMD(trip.startDate)} — {formatMD(trip.endDate)}
          </Text>
          {showRecent && (
            <View style={styles.recentBadge}>
              <Text style={styles.recentBadgeText}>
                {t("countryDetail.tripRecent")}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.tripSub}>
          {trip.days === 1
            ? t("countryDetail.tripDayOnly")
            : t("countryDetail.tripDuration", { days: trip.days })}
        </Text>
      </View>
      {!editMode && <Text style={styles.chev}>›</Text>}
    </Pressable>
  );

  const renderRightActions = () => (
    <RectButton style={styles.deleteAction} onPress={onDelete}>
      <Text style={styles.deleteActionText}>{t("countryDetail.deleteAction")}</Text>
    </RectButton>
  );

  return (
    <Animated.View style={[styles.tripWrapper, { transform: [{ rotate }] }]}>
      {editMode ? (
        <Swipeable
          renderRightActions={renderRightActions}
          friction={2}
          rightThreshold={40}
          overshootRight={false}
        >
          {content}
        </Swipeable>
      ) : (
        content
      )}
    </Animated.View>
  );
}
