import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  isSubscribed: boolean;
  // 미구독 시 카드를 누르면 구독 화면으로 이동시킨다. 구독중일 땐 정적 카드라 사용 안 됨.
  onPress: () => void;
  // 미구독 사용자에게 보여줄 카피
  promoHeadline: string;
  promoSub: string;
  promoCta: string;
  // 구독중인 사용자에게 보여줄 카피
  activeHeadline: string;
  activeFeatures: string;
  activeBadge: string;
};

// 설정 화면 최상단의 구독 진입점.
// - 미구독: 강조 색의 풀폭 배너 + Upgrade CTA → 누르면 구독 화면 진입
// - 구독중: 동일한 강조 톤 + PREMIUM 배지 + 활성 기능 요약 (정적 카드)
export default function SubscriptionEntryCard({
  theme,
  isSubscribed,
  onPress,
  promoHeadline,
  promoSub,
  promoCta,
  activeHeadline,
  activeFeatures,
  activeBadge,
}: Props) {
  const styles = makeStyles(theme);

  if (isSubscribed) {
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headline}>{activeHeadline}</Text>
          <Text style={styles.sub}>{activeFeatures}</Text>
        </View>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>{activeBadge}</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.headline}>{promoHeadline}</Text>
        <Text style={styles.sub}>{promoSub}</Text>
      </View>
      <View style={styles.ctaPill}>
        <Text style={styles.ctaPillText}>{promoCta}</Text>
      </View>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.accentSoftBg,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    headline: {
      color: theme.accentSoftText,
      fontSize: 15,
      fontWeight: "800",
    },
    sub: {
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
    activeBadge: {
      backgroundColor: "#22c55e",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
    },
    activeBadgeText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "800",
    },
  });
}
