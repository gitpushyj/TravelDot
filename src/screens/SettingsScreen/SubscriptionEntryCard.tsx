import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  isSubscribed: boolean;
  onPress: () => void;
  // 구독 안 된 사용자에게 보여줄 헤드라인/CTA
  promoHeadline: string;
  promoSub: string;
  promoCta: string;
  // 이미 구독 중인 사용자에게 보여줄 라벨
  activeLabel: string;
  activeSub: string;
};

// 설정 화면 최상단의 구독 진입점.
// - 미구독: 강조 색의 풀폭 배너로 노출
// - 구독중: 카드 한 줄로 차분하게 노출
export default function SubscriptionEntryCard({
  theme,
  isSubscribed,
  onPress,
  promoHeadline,
  promoSub,
  promoCta,
  activeLabel,
  activeSub,
}: Props) {
  const styles = makeStyles(theme);

  if (isSubscribed) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.activeCard,
          pressed && { opacity: 0.85 },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.activeLabel}>{activeLabel}</Text>
          <Text style={styles.activeSub}>{activeSub}</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.promoCard, pressed && { opacity: 0.9 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.promoHeadline}>{promoHeadline}</Text>
        <Text style={styles.promoSub}>{promoSub}</Text>
      </View>
      <View style={styles.ctaPill}>
        <Text style={styles.ctaPillText}>{promoCta}</Text>
      </View>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    promoCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.accentSoftBg,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    promoHeadline: {
      color: theme.accentSoftText,
      fontSize: 15,
      fontWeight: "800",
    },
    promoSub: {
      color: theme.accentSoftText,
      fontSize: 12,
      marginTop: 2,
      opacity: 0.85,
    },
    ctaPill: {
      backgroundColor: theme.accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
    },
    ctaPillText: {
      color: theme.accentOn,
      fontSize: 12,
      fontWeight: "800",
    },
    activeCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    activeLabel: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    activeSub: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    chev: {
      color: theme.textMuted,
      fontSize: 22,
      fontWeight: "400",
    },
  });
}
