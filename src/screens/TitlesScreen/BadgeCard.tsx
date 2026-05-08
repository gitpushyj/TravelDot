import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  localizedBadgeDescription,
  localizedBadgeTitle,
} from "../../features/badges/badgeI18n";
import type { BadgeDefinition } from "../../features/badges/badges";
import { tierVisualFromBadgeId } from "../../features/travel/tierVisuals";
import { getCurrentLocale } from "../../i18n";
import type { Theme } from "../../theme/theme";

import TierBadgeIcon from "./TierBadgeIcon";
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
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const locale = getCurrentLocale();
  const tierVisual = badge.isTier ? tierVisualFromBadgeId(badge.id) : null;
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
      {tierVisual ? (
        <View style={styles.cardIconWrap}>
          <TierBadgeIcon visual={tierVisual} size={40} locked={locked} />
        </View>
      ) : (
        <Text style={[styles.cardEmoji, locked && styles.cardEmojiLocked]}>
          {locked ? "🔒" : badge.emoji}
        </Text>
      )}
      <Text
        style={[styles.cardTitle, locked && styles.cardTitleLocked]}
        numberOfLines={2}
      >
        {localizedBadgeTitle(badge, t, locale)}
      </Text>
      <Text
        style={[styles.cardDesc, locked && styles.cardDescLocked]}
        numberOfLines={3}
      >
        {localizedBadgeDescription(badge, t, locale)}
      </Text>
      {active && !locked && (
        <View style={styles.activeMark}>
          <Text style={styles.activeMarkText}>✓</Text>
        </View>
      )}
    </Pressable>
  );
}
