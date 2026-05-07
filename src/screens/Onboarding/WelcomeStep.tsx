import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Circle, Path } from "react-native-svg";

import type { Theme } from "../../theme/theme";
import { useTheme } from "../../theme/themeStore";

import { makeOnboardingStyles } from "./styles";

type Props = { onNext: () => void };

export default function WelcomeStep({ onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);

  return (
    <>
      <View style={styles.body}>
        <View style={{ alignItems: "center", marginTop: 24, marginBottom: 24 }}>
          <Svg width={140} height={140} viewBox="0 0 140 140">
            <Circle
              cx={70}
              cy={70}
              r={56}
              stroke={theme.accent}
              strokeWidth={4}
              fill="none"
            />
            <Path
              d="M28 86 L54 60 L74 78 L96 50 L114 68"
              stroke={theme.accent}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={54} cy={60} r={4} fill={theme.accent} />
            <Circle cx={74} cy={78} r={4} fill={theme.accent} />
            <Circle cx={96} cy={50} r={4} fill={theme.accent} />
          </Svg>
        </View>
        <Text style={[styles.title, { textAlign: "center" }]}>
          {t("onboarding.welcome.title")}
        </Text>
        <View style={{ marginTop: 28, gap: 14 }}>
          <PointRow theme={theme} text={t("onboarding.welcome.point1")} />
          <PointRow theme={theme} text={t("onboarding.welcome.point2")} />
          <PointRow theme={theme} text={t("onboarding.welcome.point3")} />
          <PointRow theme={theme} text={t("onboarding.welcome.point4")} />
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable
          onPress={onNext}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
          ]}
        >
          <Text style={styles.primaryBtnText}>{t("onboarding.welcome.next")}</Text>
        </Pressable>
      </View>
    </>
  );
}

function PointRow({ theme, text }: { theme: Theme; text: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.accent,
          marginTop: 7,
        }}
      />
      <Text
        style={{
          flex: 1,
          color: theme.textSecondary,
          fontSize: 15,
          lineHeight: 22,
        }}
      >
        {text}
      </Text>
    </View>
  );
}
