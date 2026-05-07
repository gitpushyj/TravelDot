import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import AppleLogoIcon from "./AppleLogoIcon";
import ChevronIcon from "./ChevronIcon";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
};

export default function AppleSignInButton({ label, onPress, loading }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.btn,
        pressed && !loading && styles.btnPressed,
        loading && styles.btnDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <View style={styles.row}>
          <AppleLogoIcon size={20} color="#FFFFFF" />
          <Text style={styles.label}>{label}</Text>
          <ChevronIcon size={18} color="#aaaaaa" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#000000",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 56,
    width: "100%",
  },
  btnPressed: { backgroundColor: "#1f1f1f" },
  btnDisabled: { opacity: 0.6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    flex: 1,
    textAlign: "center",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
