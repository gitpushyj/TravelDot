import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";

import type { Theme } from "../../theme/theme";
import { useTheme } from "../../theme/themeStore";

type Props = {
  onPressCta: () => void;
  onPressLater: () => void;
};

// 프리미엄 안내 페이지 하단 고정 푸터.
// 기본 CTA: 구독 안내 화면으로 이동 / 보조 링크: 안내를 닫고 채팅으로.
export default function PremiumIntroFooter({ onPressCta, onPressLater }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <>
      <Pressable
        onPress={onPressCta}
        style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>{t("premiumIntro.footer.cta")}</Text>
      </Pressable>
      <Pressable
        onPress={onPressLater}
        style={({ pressed }) => (pressed ? styles.laterPressed : null)}
        accessibilityRole="button"
        hitSlop={8}
      >
        <Text style={styles.laterText}>{t("premiumIntro.footer.later")}</Text>
      </Pressable>
    </>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    cta: {
      backgroundColor: theme.accent,
      borderRadius: 999,
      paddingVertical: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaPressed: { opacity: 0.85 },
    ctaText: {
      color: theme.accentOn,
      fontSize: 16,
      fontWeight: "700",
    },
    laterPressed: { opacity: 0.6 },
    laterText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
      textAlign: "center",
      textDecorationLine: "underline",
      marginTop: 12,
    },
  });
}
