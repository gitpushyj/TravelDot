import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { isAppleSignInAvailable } from "../features/auth/appleSignIn";
import { useAuthStore } from "../features/auth/authStore";
import { BG_COLOR } from "../utils/heatmap";

export default function LoginScreen() {
  const { t } = useTranslation();
  const signingIn = useAuthStore((s) => s.signingIn);
  const signInGoogle = useAuthStore((s) => s.signInGoogle);
  const signInApple = useAuthStore((s) => s.signInApple);

  const [appleAvailable, setAppleAvailable] = useState(false);
  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const onPressGoogle = async () => {
    const r = await signInGoogle();
    if (r.ok) return;
    if (r.cancelled) return;
    Alert.alert(t("alerts.loginFailed"), r.message);
  };

  const onPressApple = async () => {
    const r = await signInApple();
    if (r.ok) return;
    if (r.cancelled) return;
    Alert.alert(t("alerts.loginFailed"), r.message);
  };

  return (
    <View style={styles.root}>
      <View style={styles.center}>
        <Text style={styles.brand}>TravelDot</Text>
        <Image
          source={require("../../assets/login_image.png")}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.bottom}>
        <Pressable
          onPress={onPressGoogle}
          disabled={signingIn}
          style={({ pressed }) => [
            styles.googleBtn,
            pressed && !signingIn && styles.googleBtnPressed,
            signingIn && styles.btnDisabled,
          ]}
        >
          {signingIn ? (
            <ActivityIndicator color="#1a1a1a" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>{t("login.googleContinue")}</Text>
            </>
          )}
        </Pressable>

        {appleAvailable && (
          <Pressable
            onPress={onPressApple}
            disabled={signingIn}
            style={({ pressed }) => [
              styles.appleBtn,
              pressed && !signingIn && styles.appleBtnPressed,
              signingIn && styles.btnDisabled,
            ]}
          >
            {signingIn ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.appleIcon}>{""}</Text>
                <Text style={styles.appleText}>{t("login.appleContinue")}</Text>
              </>
            )}
          </Pressable>
        )}
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
  heroImage: {
    width: "100%",
    maxWidth: 420,
    aspectRatio: 1536 / 1024,
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
  btnDisabled: {
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
  appleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#000000",
    borderRadius: 14,
    paddingVertical: 14,
    width: "100%",
    minHeight: 52,
  },
  appleBtnPressed: {
    backgroundColor: "#1f1f1f",
  },
  appleIcon: {
    color: "#ffffff",
    fontSize: 20,
    marginTop: -2,
  },
  appleText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
