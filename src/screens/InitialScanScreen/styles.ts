import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

export function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
      paddingTop: 56,
    },
    centerWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 16,
    },
    loadingTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "700",
      marginTop: 8,
    },
    loadingBody: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
    },
    loadingCount: {
      color: theme.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 8,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 140,
    },
    list: {
      gap: 12,
    },
    row: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 14,
    },
    rowMain: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    rowText: { flex: 1 },
    rowTitleLine: {
      flexDirection: "row",
      alignItems: "center",
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
    rowDate: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 4,
    },
    rowMeta: {
      color: theme.textMuted,
      fontSize: 11,
      marginTop: 4,
    },
    flagText: { fontSize: 36 },
    thumbRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 12,
    },
    thumbWrap: {
      width: 60,
      height: 60,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: theme.flagBoxBg,
    },
    thumb: { width: "100%", height: "100%" },
    thumbOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
    },
    thumbOverlayText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
    actionRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      gap: 6,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    actionBtnPressed: {
      opacity: 0.7,
    },
    rejectBtn: {
      backgroundColor: theme.tabRowBg,
    },
    rejectBtnIcon: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 16,
    },
    rejectBtnText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    acceptBtn: {
      backgroundColor: theme.accent,
    },
    acceptBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 36,
      backgroundColor: theme.homeBg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.cardBorder,
    },
    primaryBtn: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    primaryBtnText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },
  });
}
