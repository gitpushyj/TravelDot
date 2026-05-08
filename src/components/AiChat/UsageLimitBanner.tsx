import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import type { TierName } from "../../features/aiChat/types";
import { useTheme } from "../../theme/themeStore";

type Props = {
  tier: TierName;
  limit: number;
};

export default function UsageLimitBanner({ tier, limit }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.root}>
      <Text style={styles.text}>
        {t(`aiChat.error.rateLimited.${tier}`, { limit })}
      </Text>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.dangerBg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.cardBorder,
    },
    text: {
      color: theme.dangerOn,
      fontSize: 13,
      textAlign: "center",
    },
  });
}
