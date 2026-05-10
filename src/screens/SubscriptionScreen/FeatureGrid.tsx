import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  Award,
  CloudSync,
  MessagesSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";

import type { Theme } from "../../theme/theme";

type Props = { theme: Theme };

type FeatureItem = {
  Icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
};

export default function FeatureGrid({ theme }: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isDark = theme.statusBar === "light";

  const items: FeatureItem[] = useMemo(
    () => [
      {
        Icon: CloudSync,
        iconColor: "#ff7a3d",
        iconBg: isDark ? "rgba(255,122,61,0.18)" : "#ffe1d3",
        label: t("subscription.feature.sync"),
      },
      {
        Icon: MessagesSquare,
        iconColor: "#22c55e",
        iconBg: isDark ? "rgba(34,197,94,0.18)" : "#d4f4dd",
        label: t("subscription.feature.aiChat"),
      },
      {
        Icon: Award,
        iconColor: "#6366f1",
        iconBg: isDark ? "rgba(99,102,241,0.18)" : "#e0e3ff",
        label: t("subscription.feature.titles"),
      },
      {
        Icon: Sparkles,
        iconColor: "#a855f7",
        iconBg: isDark ? "rgba(168,85,247,0.18)" : "#efddff",
        label: t("subscription.feature.premium"),
      },
    ],
    [t, isDark]
  );

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {items.slice(0, 2).map((item) => (
          <FeatureCell key={item.label} item={item} styles={styles} />
        ))}
      </View>
      <View style={styles.row}>
        {items.slice(2, 4).map((item) => (
          <FeatureCell key={item.label} item={item} styles={styles} />
        ))}
      </View>
    </View>
  );
}

function FeatureCell({
  item,
  styles,
}: {
  item: FeatureItem;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { Icon, iconColor, iconBg, label } = item;
  return (
    <View style={styles.cell}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Icon size={22} color={iconColor} strokeWidth={2.2} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
      gap: 10,
    },
    row: {
      flexDirection: "row",
    },
    cell: {
      flex: 1,
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 4,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
      lineHeight: 16,
    },
  });
}
