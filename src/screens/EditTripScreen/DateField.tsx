import React, { useMemo } from "react";
import { Text, TextInput, View } from "react-native";

import type { Theme } from "../../theme/theme";
import { makeStyles } from "./styles";

type Props = {
  theme: Theme;
  label: string;
  value: string;
  onChange: (v: string) => void;
};

export default function DateField({ theme, label, value, onChange }: Props) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.dateField}>
      <Text style={styles.dateLabel}>{label}</Text>
      <TextInput
        style={styles.dateInput}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textMuted}
        maxLength={10}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}
