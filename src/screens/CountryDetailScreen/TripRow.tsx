import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";

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
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const countryColor = colorForCountry(trip.countryCode);

  // iOS 편집 모드의 잔잔한 흔들림. 항목별로 위상 차이를 줘서 한꺼번에 같은
  // 방향으로 흔들리지 않도록 한다.
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
    const phase = (h % 100) / 100;
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
          toValue: 0,
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
    inputRange: [0, 0.5, 1],
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
          <Text style={styles.tripThumbBadgeText}>{trip.photos}장</Text>
        </View>
      </View>
      <View style={styles.tripBody}>
        <View style={styles.tripTitleRow}>
          <Text style={styles.tripDate}>
            {formatMD(trip.startDate)} — {formatMD(trip.endDate)}
          </Text>
          {showRecent && (
            <View style={styles.recentBadge}>
              <Text style={styles.recentBadgeText}>최근</Text>
            </View>
          )}
        </View>
        <Text style={styles.tripSub}>
          {trip.days === 1 ? "1일 (당일)" : `${trip.days}일 여행`}
        </Text>
      </View>
      {!editMode && <Text style={styles.chev}>›</Text>}
    </Pressable>
  );

  const renderRightActions = () => (
    <RectButton style={styles.deleteAction} onPress={onDelete}>
      <Text style={styles.deleteActionText}>삭제</Text>
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
