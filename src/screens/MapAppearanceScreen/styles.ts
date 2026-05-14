import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 56,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
    cancel: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: "600",
      minWidth: 40,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 40,
    },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      marginBottom: 8,
      marginLeft: 4,
      textTransform: "uppercase",
    },
    sectionLabelSpaced: {
      marginTop: 24,
    },
    mapPreviewWrap: {
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    mapPreview: {
      // DotMap은 cover-fit(Math.max(widthFit, heightFit))이라 자연 비율(360:145)보다
      // 더 높은 컨테이너를 주면 baseScale이 heightFit으로 잡혀 좌우가 잘린다.
      // 미리보기에선 세계지도 전체가 보여야 하므로 자연 비율을 그대로 쓴다.
      width: "100%",
      aspectRatio: 360 / 145,
    },
  });
}
