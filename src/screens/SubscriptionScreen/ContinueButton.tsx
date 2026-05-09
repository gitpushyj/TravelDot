import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  label: string;
  loading: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function ContinueButton({
  theme,
  label,
  loading,
  disabled,
  onPress,
}: Props) {
  const styles = makeStyles(theme);
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        isDisabled && styles.btnDisabled,
        pressed && !isDisabled && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.accentOn} />
      ) : (
        <Text style={styles.btnText}>{label}</Text>
      )}
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    btn: {
      backgroundColor: theme.accent,
      borderRadius: 999,
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    btnDisabled: { opacity: 0.5 },
    btnText: {
      color: theme.accentOn,
      fontSize: 17,
      fontWeight: "700",
    },
  });
}
