import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { MilestoneProgress } from "../../features/milestone/milestoneTypes";
import type { Theme } from "../../theme/theme";

import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  label: string;
  progress: MilestoneProgress;
  active: boolean;
  onPress: () => void;
};

export default function MilestoneRow({
  theme,
  label,
  progress,
  active,
  onPress,
}: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const progressText = progress.reachedFinal
    ? t("milestones.preview.completed")
    : t("milestones.preview.progress", {
        current: progress.current,
        next: progress.next,
        unit:
          progress.unit === "days"
            ? t("home.daysUnit")
            : t("home.countriesUnit"),
      });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        active && styles.rowActive,
        pressed && !active && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text
        style={[
          styles.rowProgress,
          progress.reachedFinal && styles.rowProgressDone,
        ]}
      >
        {progressText}
      </Text>
    </Pressable>
  );
}
