import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { BadgeDefinition } from "../../features/badges/badges";
import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  badge: BadgeDefinition;
  locked: boolean;
  active: boolean;
  onPress: () => void;
};

export default function BadgeCard({
  theme,
  badge,
  locked,
  active,
  onPress,
}: Props) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      style={({ pressed }) => [
        styles.card,
        locked && styles.cardLocked,
        active && !locked && styles.cardActive,
        pressed && !locked && { opacity: 0.75 },
      ]}
    >
      <Text style={[styles.cardEmoji, locked && styles.cardEmojiLocked]}>
        {locked ? "🔒" : badge.emoji}
      </Text>
      <Text
        style={[styles.cardTitle, locked && styles.cardTitleLocked]}
        numberOfLines={2}
      >
        {badge.titleKo}
      </Text>
      <Text
        style={[styles.cardDesc, locked && styles.cardDescLocked]}
        numberOfLines={3}
      >
        {badge.description}
      </Text>
      {active && !locked && (
        <View style={styles.activeMark}>
          <Text style={styles.activeMarkText}>✓</Text>
        </View>
      )}
    </Pressable>
  );
}
