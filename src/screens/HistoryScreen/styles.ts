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
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    iconBtnPressed: { backgroundColor: theme.tabRowBg },
    iconBtnPlaceholder: { width: 40, height: 40 },
    iconBtnText: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "600",
      lineHeight: 24,
    },
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    listContent: {
      paddingBottom: 60,
    },
    statsCard: {
      flexDirection: "row",
      backgroundColor: theme.cardBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingVertical: 18,
      paddingHorizontal: 8,
      marginHorizontal: 20,
      marginTop: 8,
      marginBottom: 16,
    },
    statCol: {
      flex: 1,
      alignItems: "center",
      gap: 4,
    },
    statNum: {
      color: theme.textPrimary,
      fontSize: 26,
      fontWeight: "800",
    },
    statUnit: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.cardBorder,
      marginVertical: 6,
    },
    sortRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    sortChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "transparent",
    },
    sortChipPressed: {
      backgroundColor: theme.tabRowBg,
    },
    sortChipActive: {
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    sortChipText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "700",
    },
    sortChipTextActive: {
      color: theme.textPrimary,
    },
    rowSep: { height: 1, backgroundColor: theme.cardBorder, marginLeft: 20 },
    sectionHeader: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 6,
      backgroundColor: theme.homeBg,
    },
    sectionHeaderText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
    },
    flagBox: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: theme.flagBoxBg,
      alignItems: "center",
      justifyContent: "center",
    },
    flagText: { fontSize: 26 },
    rowMain: { flex: 1 },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    rowName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    rowCode: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    rowSub: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    rowDate: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
      marginRight: 4,
    },
    chev: {
      color: theme.textMuted,
      fontSize: 22,
      fontWeight: "400",
    },
    emptyWrap: {
      paddingHorizontal: 20,
      paddingVertical: 36,
      alignItems: "center",
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 13,
      textAlign: "center",
    },
    rowWrap: {
      // 행 본문 + hint 링크를 묶는 외곽 컨테이너. 본문 Pressable과 hint Pressable
      // 영역이 분리되도록.
    },
    hintRow: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    hintDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.cardBorder,
      marginBottom: 8,
    },
    hintText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
  });
}
