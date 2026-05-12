import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { LEGAL_URLS } from "../../lib/legal";
import type { Theme } from "../../theme/theme";

// Apple Review Guideline 3.1.2 — 자동갱신 구독 화면 안에 Privacy Policy / Terms of Use
// 두 functional link가 모두 노출되어야 한다. RestoreLink와 같은 톤(작은 회색 밑줄).
type Props = {
  theme: Theme;
  privacyLabel: string;
  termsLabel: string;
};

export default function LegalLinks({ theme, privacyLabel, termsLabel }: Props) {
  const styles = makeStyles(theme);
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => void Linking.openURL(LEGAL_URLS.privacyPolicy)}
        hitSlop={8}
      >
        <Text style={styles.link}>{privacyLabel}</Text>
      </Pressable>
      <Text style={styles.sep}>·</Text>
      <Pressable
        onPress={() => void Linking.openURL(LEGAL_URLS.termsOfUse)}
        hitSlop={8}
      >
        <Text style={styles.link}>{termsLabel}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    link: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 16,
      textDecorationLine: "underline",
    },
    sep: {
      color: theme.textMuted,
      fontSize: 12,
      lineHeight: 16,
    },
  });
}
