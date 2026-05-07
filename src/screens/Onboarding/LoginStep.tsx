import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import AppleSignInButton from "../../components/auth/AppleSignInButton";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";
import { isAppleSignInAvailable } from "../../features/auth/appleSignIn";
import { useAuthStore } from "../../features/auth/authStore";
import { useTheme } from "../../theme/themeStore";

import LoginDivider from "./LoginDivider";
import LoginFeatureCards from "./LoginFeatureCards";
import LoginHero from "./LoginHero";

type Props = { onNext: () => void };

export default function LoginStep({ onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const user = useAuthStore((s) => s.user);
  const signingIn = useAuthStore((s) => s.signingIn);
  const signInGoogle = useAuthStore((s) => s.signInGoogle);
  const signInApple = useAuthStore((s) => s.signInApple);

  const [appleAvailable, setAppleAvailable] = useState(false);
  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  // 로그인 성공 시 user가 채워지면 다음 단계로 진행한다.
  // 재로그인 컨텍스트에서는 onNext가 no-op이어도 App.tsx 상위 분기가 authUser
  // 변화를 감지해 메인 UI로 자동 전환한다.
  useEffect(() => {
    if (user) onNext();
  }, [user, onNext]);

  const onPressGoogle = async () => {
    const r = await signInGoogle();
    if (r.ok || r.cancelled) return;
    Alert.alert(t("alerts.loginFailed"), r.message);
  };

  const onPressApple = async () => {
    const r = await signInApple();
    if (r.ok || r.cancelled) return;
    Alert.alert(t("alerts.loginFailed"), r.message);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LoginHero
        theme={theme}
        title={t("onboarding.login.title")}
        subtitle={t("onboarding.login.subtitle")}
      />

      <View style={styles.buttons}>
        <GoogleSignInButton
          label={t("login.googleContinue")}
          onPress={onPressGoogle}
          loading={signingIn}
        />
        {appleAvailable && (
          <AppleSignInButton
            label={t("login.appleContinue")}
            onPress={onPressApple}
            loading={signingIn}
          />
        )}
      </View>

      <View style={styles.spacer} />

      <View style={styles.divider}>
        <LoginDivider theme={theme} label={t("onboarding.login.featuresLabel")} />
      </View>

      <LoginFeatureCards theme={theme} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  // flexGrow:1 + spacer(flex:1)로 기능 카드를 화면 하단 영역에 고정.
  // paddingBottom 48로 바닥과 거리를 두고, spacer maxHeight로 중간 빈 공간이
  // 너무 커지지 않도록 제한. 콘텐츠가 길면 spacer가 0이 되어 자연 스크롤.
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 48,
  },
  buttons: {
    marginTop: 28,
    gap: 12,
  },
  spacer: {
    flex: 1,
    minHeight: 24,
    maxHeight: 80,
  },
  divider: {
    marginBottom: 20,
  },
});
