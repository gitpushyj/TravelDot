import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import WheelPicker, { WheelItem } from "../../components/WheelPicker";
import { useTheme } from "../../theme/themeStore";

type Props = {
  year: number;
  month: number;
  day: number;
  yearItems: WheelItem[];
  monthItems: WheelItem[];
  dayItems: WheelItem[];
  onYearChange: (v: number) => void;
  onMonthChange: (v: number) => void;
  onDayChange: (v: number) => void;
};

export default function BirthDateCard(props: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{t("onboarding.birth.cardLabel")}</Text>

      <View style={styles.headerRow}>
        <Text style={styles.colHeader}>{t("onboarding.birth.year")}</Text>
        <Text style={styles.colHeader}>{t("onboarding.birth.month")}</Text>
        <Text style={styles.colHeader}>{t("onboarding.birth.day")}</Text>
      </View>

      <View style={styles.pickerRow}>
        <View style={styles.column}>
          <WheelPicker
            items={props.yearItems}
            selectedValue={String(props.year)}
            onChange={(v) => props.onYearChange(Number(v))}
          />
        </View>
        <Separator color={theme.textMuted} />
        <View style={styles.column}>
          <WheelPicker
            items={props.monthItems}
            selectedValue={String(props.month)}
            onChange={(v) => props.onMonthChange(Number(v))}
          />
        </View>
        <Separator color={theme.textMuted} />
        <View style={styles.column}>
          <WheelPicker
            items={props.dayItems}
            selectedValue={String(props.day)}
            onChange={(v) => props.onDayChange(Number(v))}
          />
        </View>
      </View>
    </View>
  );
}

function Separator({ color }: { color: string }) {
  return (
    <View style={separatorStyles.wrap}>
      <Text style={[separatorStyles.dot, { color }]}>·</Text>
    </View>
  );
}

const separatorStyles = StyleSheet.create({
  wrap: {
    width: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    fontSize: 22,
    fontWeight: "800",
  },
});

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: 18,
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    cardLabel: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 12,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 4,
    },
    colHeader: {
      flex: 1,
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },
    pickerRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    column: {
      flex: 1,
    },
  });
}
