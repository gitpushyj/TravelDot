import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import ChevronIcon from "./ChevronIcon";
import GoogleGIcon from "./GoogleGIcon";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
};

export default function GoogleSignInButton({ label, onPress, loading }: Props) {
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
        <ActivityIndicator color="#1a1a1a" />
      ) : (
        <View style={styles.row}>
          <GoogleGIcon size={22} />
          <Text style={styles.label}>{label}</Text>
          <ChevronIcon size={18} color="#9a948a" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 56,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  btnPressed: { backgroundColor: "#f3efe6" },
  btnDisabled: { opacity: 0.6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    flex: 1,
    textAlign: "center",
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "700",
  },
});
