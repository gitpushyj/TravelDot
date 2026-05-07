import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../../features/auth/authStore";
import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";

type Props = { onNext: () => void };

export default function LoginStep({ onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);
  const localStyles = useMemo(() => makeLocalStyles(), []);

  const user = useAuthStore((s) => s.user);
  const signingIn = useAuthStore((s) => s.signingIn);
  const signInGoogle = useAuthStore((s) => s.signInGoogle);

  useEffect(() => {
    if (user) onNext();
  }, [user, onNext]);

  const onPressGoogle = async () => {
    const r = await signInGoogle();
    if (r.ok) return; // useEffect가 onNext 호출
    if (r.cancelled) return;
    Alert.alert(t("alerts.loginFailed"), r.message);
  };

  return (
    <>
      <View style={styles.body}>
        <Text style={styles.title}>{t("onboarding.login.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.login.subtitle")}</Text>
      </View>
      <View style={styles.footer}>
        <Pressable
          onPress={onPressGoogle}
          disabled={signingIn}
          style={({ pressed }) => [
            localStyles.googleBtn,
            pressed && !signingIn && localStyles.googleBtnPressed,
            signingIn && { opacity: 0.6 },
          ]}
        >
          {signingIn ? (
            <ActivityIndicator color="#1a1a1a" />
          ) : (
            <>
              <Text style={localStyles.googleIcon}>G</Text>
              <Text style={localStyles.googleText}>{t("login.googleContinue")}</Text>
            </>
          )}
        </Pressable>
      </View>
    </>
  );
}

function makeLocalStyles() {
  return StyleSheet.create({
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
    googleBtnPressed: { backgroundColor: "#e8e8e8" },
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
}
