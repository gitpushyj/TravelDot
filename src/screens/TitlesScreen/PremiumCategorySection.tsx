import React from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { BadgeCategory } from "../../features/badges/badges";
import type { Theme } from "../../theme/theme";

import type { makeStyles } from "./styles";

type Props = {
  category: BadgeCategory;
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
};

export default function PremiumCategorySection({ category, styles }: Props) {
  const { t } = useTranslation();
  const slotCount = t(`titles.premium.slotCounts.${category}`, {
    defaultValue: "1",
  });
  const slots = Number(slotCount) || 1;
  return (
    <View style={styles.premiumCatSection}>
      {Array.from({ length: slots }, (_, i) => (
        <View key={i} style={styles.premiumLockedRow}>
          <Text style={styles.premiumLockedIcon}>🔒</Text>
          <Text style={styles.premiumLockedText}>
            {t("titles.premium.lockedTitle")}
          </Text>
        </View>
      ))}
    </View>
  );
}
