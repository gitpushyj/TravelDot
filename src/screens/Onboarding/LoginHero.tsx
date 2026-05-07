import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../theme/theme";

type Props = {
  theme: Theme;
  title: string;
  subtitle: string;
};

export default function LoginHero({ theme, title, subtitle }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      <Image
        source={require("../../../assets/login_image.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    // 처음 참조 이미지의 큼직한 헤드라인 비율을 맞추기 위해 fontSize/lineHeight 상향.
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  image: {
    // 1024×1024(1:1) 신규 자산. 화면 가로의 약 45% 비율로 노출.
    width: 175,
    height: 175,
  },
});
