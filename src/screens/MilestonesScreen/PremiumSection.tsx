import React from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ALL_PREMIUM_MILESTONE_KINDS } from "../../features/milestone/milestoneTypes";
import { useEntitlementStore } from "../../features/entitlement/entitlementStore";
import type { Theme } from "../../theme/theme";

import type { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
  onPressUpsell: () => void;
};

export default function PremiumSection({ theme: _theme, styles, onPressUpsell }: Props) {
  const { t } = useTranslation();
  const isPremium = useEntitlementStore((s) => s.isPremium);

  return (
    <View style={styles.premiumSection}>
      <View style={styles.premiumHeader}>
        {isPremium ? null : <Text style={styles.premiumLock}>🔒</Text>}
        <Text style={styles.premiumTitle}>
          {t("milestones.premium.sectionTitle")} ({ALL_PREMIUM_MILESTONE_KINDS.length})
        </Text>
      </View>
      {ALL_PREMIUM_MILESTONE_KINDS.map((id) => (
        <View key={id} style={styles.premiumCard}>
          <Text style={styles.premiumIcon}>
            {t(`milestones.premium.items.${id}.icon`)}
          </Text>
          <View style={styles.premiumTextCol}>
            <Text style={styles.premiumName}>
              {t(`milestones.premium.items.${id}.name`)}
            </Text>
            <Text style={styles.premiumDescription}>
              {t(`milestones.premium.items.${id}.description`)}
            </Text>
          </View>
          {isPremium ? null : <Text style={styles.premiumCardLock}>🔒</Text>}
        </View>
      ))}
      {isPremium ? null : (
        <Pressable onPress={onPressUpsell} style={styles.premiumCta}>
          <Text style={styles.premiumCtaText}>
            {t("milestones.premium.ctaUnlock")} →
          </Text>
        </Pressable>
      )}
    </View>
  );
}
