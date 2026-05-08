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
    iconBtnActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    iconBtnDisabled: {
      opacity: 0.4,
    },
    iconBtnText: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "600",
      lineHeight: 24,
    },
    iconBtnTextActive: {
      color: "#fff",
    },
    editIcon: {
      fontSize: 18,
      lineHeight: 22,
    },
    headerCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
      gap: 6,
    },
    headerFlag: { fontSize: 18 },
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    headerCode: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 60,
    },
    heroCard: {
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: theme.accent,
      aspectRatio: 16 / 11,
      marginBottom: 16,
    },
    heroDots: {
      ...StyleSheet.absoluteFillObject,
    },
    statsCard: {
      flexDirection: "row",
      backgroundColor: theme.cardBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingVertical: 18,
      paddingHorizontal: 8,
      marginBottom: 28,
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
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    sortLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    editHint: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "700",
    },
    sectionHeaderRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    mergeBtn: {
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    mergeBtnText: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: "600",
    },
    emptyWrap: {
      paddingVertical: 36,
      alignItems: "center",
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 13,
    },
    yearGroup: {
      marginBottom: 24,
    },
    yearHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 10,
    },
    yearLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    yearLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.cardBorder,
    },
    tripWrapper: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 8,
    },
    tripCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 12,
      gap: 14,
    },
    tripThumb: {
      width: 64,
      height: 64,
      borderRadius: 14,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: 6,
    },
    tripThumbInner: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.35,
    },
    tripThumbBadge: {
      backgroundColor: "rgba(0,0,0,0.65)",
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    tripThumbBadgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "800",
    },
    tripBody: { flex: 1, gap: 4 },
    tripTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    tripDate: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    recentBadge: {
      backgroundColor: theme.accentSoftBg,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    recentBadgeText: {
      color: theme.accentSoftText,
      fontSize: 10,
      fontWeight: "800",
    },
    chev: {
      color: theme.textMuted,
      fontSize: 22,
      fontWeight: "400",
    },
    deleteAction: {
      width: 84,
      backgroundColor: "#e64a3b",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 0,
    },
    deleteActionText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "800",
    },
  });
}

export type CountryDetailStyles = ReturnType<typeof makeStyles>;
