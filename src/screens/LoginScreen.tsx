import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuthStore } from "../features/auth/authStore";
import { BG_COLOR } from "../utils/heatmap";

export default function LoginScreen() {
  const signingIn = useAuthStore((s) => s.signingIn);
  const signInGoogle = useAuthStore((s) => s.signInGoogle);

  const onPressGoogle = async () => {
    const r = await signInGoogle();
    if (r.ok) return;
    if (r.cancelled) return;
    Alert.alert("로그인 실패", r.message);
  };

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <Text style={styles.brand}>VisitGrid</Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          onPress={onPressGoogle}
          disabled={signingIn}
          style={({ pressed }) => [
            styles.googleBtn,
            pressed && !signingIn && styles.googleBtnPressed,
            signingIn && styles.googleBtnDisabled,
          ]}
        >
          {signingIn ? (
            <ActivityIndicator color="#1a1a1a" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Google로 계속하기</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_COLOR,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
    justifyContent: "space-between",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  brand: {
    color: "#e8eefc",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bottom: {
    gap: 14,
    alignItems: "center",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 14,
    width: "100%",
    minHeight: 52,
  },
  googleBtnPressed: {
    backgroundColor: "#e8e8e8",
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    color: "#4285F4",
    fontSize: 20,
    fontWeight: "900",
  },
  googleText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "700",
  },
});
