import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";

type Props = {
  /** 슬라이드 좌상단 아이콘 (이모지 1글자). */
  icon: string;
  /** 아이콘 배경 색. */
  iconBg: string;
  title: string;
  desc: string;
  /** 큰 UI 데모 영역. */
  children: React.ReactNode;
};

// 프리미엄 안내 캐러셀의 슬라이드 한 장 공통 틀.
// 상단 아이콘+제목 → 한 줄 설명 → 데모 영역(children) 순서.
export default function SlideFrame({ icon, iconBg, title, desc, children }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.desc}>{desc}</Text>
      <View style={styles.demo}>{children}</View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 12,
    },
    head: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: { fontSize: 22 },
    title: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: "800",
    },
    desc: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 12,
    },
    demo: {
      flex: 1,
      marginTop: 16,
      marginBottom: 8,
      backgroundColor: theme.cardBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 14,
      justifyContent: "center",
    },
  });
}
