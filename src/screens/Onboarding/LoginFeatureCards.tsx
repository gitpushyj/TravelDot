import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Theme } from "../../theme/theme";

import LoginFeatureCard from "./LoginFeatureCard";
import {
  LockFeatureIcon,
  MapFeatureIcon,
  PhotoFeatureIcon,
} from "./loginFeatureIcons";

type Props = { theme: Theme };

export default function LoginFeatureCards({ theme }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <LoginFeatureCard
        theme={theme}
        Icon={PhotoFeatureIcon}
        title={t("onboarding.login.feature1.title")}
        desc={t("onboarding.login.feature1.desc")}
      />
      <LoginFeatureCard
        theme={theme}
        Icon={MapFeatureIcon}
        title={t("onboarding.login.feature2.title")}
        desc={t("onboarding.login.feature2.desc")}
      />
      <LoginFeatureCard
        theme={theme}
        Icon={LockFeatureIcon}
        title={t("onboarding.login.feature3.title")}
        desc={t("onboarding.login.feature3.desc")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
});
