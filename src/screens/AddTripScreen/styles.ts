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
    headerSide: {
      minWidth: 56,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "800",
    },
    headerStep: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
      marginTop: 2,
    },
    cancel: {
      color: theme.textSecondary,
      fontSize: 15,
      fontWeight: "600",
    },
    primaryRight: {
      color: theme.accent,
      fontSize: 15,
      fontWeight: "800",
      textAlign: "right",
    },
    primaryRightDisabled: {
      color: theme.textMuted,
    },

    // Step indicator
    indicatorRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 6,
      gap: 8,
    },
    indicatorSegment: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.tabRowBg,
    },
    indicatorSegmentActive: {
      backgroundColor: theme.accent,
    },
    indicatorLabels: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      gap: 8,
      marginBottom: 12,
    },
    indicatorLabelCell: {
      flex: 1,
    },
    indicatorLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    indicatorLabelActive: {
      color: theme.accent,
    },

    // Body
    body: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      gap: 20,
    },

    // Step heading
    stepHeading: {
      gap: 6,
      marginBottom: 4,
    },
    stepTitle: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "800",
    },
    stepSubtitle: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },

    // Country step — selected card
    selectedCard: {
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    selectedDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },
    selectedFlag: {
      fontSize: 22,
    },
    selectedNameCol: {
      flex: 1,
    },
    selectedName: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "800",
    },
    selectedCode: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    clearBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.tabRowBg,
    },
    clearBtnText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },

    // Search input
    searchInput: {
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.textPrimary,
      fontSize: 15,
    },

    // Country list
    listContainer: {
      flex: 1,
    },
    listSep: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.cardBorder,
    },
    countryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
    },
    countryRowSelected: {
      backgroundColor: theme.selectedRowBg,
    },
    countryRowPressed: {
      backgroundColor: theme.rowPressedBg,
    },
    countryFlag: {
      fontSize: 22,
      width: 28,
      textAlign: "center",
    },
    countryNameCol: {
      flex: 1,
    },
    countryName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    countryMeta: {
      color: theme.textSecondary,
      fontSize: 11,
      marginTop: 2,
    },
    visitedPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: theme.accentSoftBg,
    },
    visitedPillText: {
      color: theme.accentSoftText,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    sectionHeader: {
      color: theme.textSecondary,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
      marginTop: 6,
      marginBottom: 4,
      paddingHorizontal: 14,
    },
    listEmpty: {
      color: theme.textMuted,
      fontSize: 13,
      textAlign: "center",
      paddingVertical: 32,
    },

    // Photos step — date row
    section: { gap: 10 },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    helpText: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    helpTextDim: {
      color: theme.textMuted,
      fontSize: 12,
    },
    errorText: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "600",
    },

    dateRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
    },
    dateField: { flex: 1, gap: 4 },
    dateLabel: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "700",
    },
    dateInput: {
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    dateSeparator: {
      color: theme.textMuted,
      fontSize: 18,
      paddingBottom: 12,
    },

    presetRow: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    presetBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    presetBtnPressed: { backgroundColor: theme.tabRowBg },
    presetBtnActive: {
      backgroundColor: theme.accentSoftBg,
      borderColor: theme.accent,
    },
    presetBtnText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "700",
    },
    presetBtnTextActive: {
      color: theme.accentSoftText,
    },

    // Photos
    addBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    addBtnPressed: { backgroundColor: theme.tabRowBg },
    addBtnText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
    photoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    photoCell: {
      width: 96,
      height: 96,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: theme.cardBg,
    },
    photoImage: { width: "100%", height: "100%" },
    photoRemoveBtn: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "rgba(0,0,0,0.65)",
      alignItems: "center",
      justifyContent: "center",
    },
    photoRemoveText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
      lineHeight: 18,
    },
    photoEmpty: {
      paddingVertical: 24,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.cardBorder,
      gap: 4,
    },
    photoEmptyTitle: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    photoEmptyHint: {
      color: theme.textSecondary,
      fontSize: 12,
    },

    // Memo
    noteInput: {
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.textPrimary,
      fontSize: 14,
      lineHeight: 22,
      minHeight: 160,
    },

    // Summary card (note step)
    summaryCard: {
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      gap: 6,
    },
    summaryLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    summaryFlag: {
      fontSize: 20,
    },
    summaryName: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "800",
    },
    summaryDates: {
      color: theme.textSecondary,
      fontSize: 13,
    },
    summaryPhotos: {
      color: theme.textMuted,
      fontSize: 12,
    },
  });
}

export type AddTripStyles = ReturnType<typeof makeStyles>;
