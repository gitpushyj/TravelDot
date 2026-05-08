import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

type Props = { theme: Theme; days: number };

export default function GapDivider({ theme, days }: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View>
      <View style={styles.nonAdjacentSpacer} />
      <View style={styles.gapDivider}>
        <View style={styles.gapLine} />
        <Text style={styles.gapLabel}>{t("merge.gapLabel", { days })}</Text>
        <View style={styles.gapLine} />
      </View>
      <View style={styles.nonAdjacentSpacer} />
    </View>
  );
}
