import { StyleSheet } from "react-native";

import type { Theme } from "../../theme/theme";

// TopAppBar의 추정 높이. paddingTop 56 + 컨텐츠(아이콘/제목 ~32) + paddingBottom 8.
// 스크롤 컨텐츠가 바 뒤에 가려지지 않도록 ScrollView paddingTop과 일치시킨다.
export const TOP_BAR_HEIGHT = 96;

export function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.homeBg,
    },
    rootDark: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: TOP_BAR_HEIGHT,
      paddingBottom: 40,
    },
    topAppBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 56,
      paddingBottom: 8,
      paddingHorizontal: 20,
      backgroundColor: theme.homeBg,
    },
    topAppBarTitle: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    topAppBarActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    menuBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    menuBtnPressed: {
      opacity: 0.5,
    },
    menuBtnIcon: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: "700",
    },
    menuBtnImage: {
      width: 32,
      height: 32,
    },
    mapStatsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
    },
    headerLeft: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 6,
      flexShrink: 1,
      minWidth: 0,
    },
    headerBadgeChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: theme.accentSoftBg,
      maxWidth: 220,
      // 칩 내부 텍스트 시작점을 컬럼의 좌측(통계 시작점)과 시각적으로 정렬
      marginLeft: -10,
    },
    headerBadgeChipPressed: {
      opacity: 0.7,
    },
    headerBadgeChipText: {
      color: theme.accentSoftText,
      fontSize: 13,
      fontWeight: "700",
    },
    headerStatRow: {
      flexDirection: "row",
      alignItems: "baseline",
      flexShrink: 1,
    },
    headerStatNum: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: "800",
    },
    headerStatUnit: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: "600",
    },
    headerStatDot: {
      color: theme.textMuted,
      fontSize: 14,
    },
    tabPills: {
      flexDirection: "row",
      backgroundColor: theme.tabRowBg,
      borderRadius: 999,
      padding: 4,
      gap: 4,
    },
    tab: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
    },
    tabActive: {
      backgroundColor: theme.cardBg,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 1,
    },
    tabText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    tabTextActive: {
      color: theme.textPrimary,
      fontWeight: "700",
    },
    syncBar: {
      marginHorizontal: 20,
      marginTop: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: theme.cardBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    syncText: { color: theme.accentSoftText, fontSize: 12, fontWeight: "600" },
    mapStatsCard: {
      backgroundColor: theme.cardBg,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.cardBorder,
    },
    mapStatsDivider: {
      height: 1,
      backgroundColor: theme.cardBorder,
    },
    mapWrap: {
      paddingTop: 12,
      paddingBottom: 0,
      position: "relative",
    },
    // 지도 viewport 자체. height는 Reanimated로 조절된다.
    mapArea: {
      width: "100%",
      position: "relative",
    },
    // DotMap 내부 mapArea가 자연 비율(360/145) 대신 부모(애니메이션 컨테이너)
    // 크기를 그대로 쓰도록 override 한다.
    mapAreaInner: {
      flex: 1,
      width: "100%",
      aspectRatio: undefined,
    },
    // 지도 하단 가운데 드래그 핸들 영역. 시각적 인디케이터(작은 알약 모양)와
    // 충분한 터치 슬랍을 함께 가진다.
    mapResizeZone: {
      paddingTop: 10,
      paddingBottom: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    mapResizeBar: {
      width: 44,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.handleColor,
    },
    mapActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 12,
      marginBottom: 12,
    },
    mapActionBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    mapActionBtnPressed: {
      backgroundColor: theme.tabRowBg,
    },
    mapActionIcon: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    statsRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 24,
    },
    miniCard: {
      flex: 1,
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 12,
      minHeight: 140,
    },
    miniCardPressed: {
      backgroundColor: theme.tabRowBg,
    },
    miniBadge: {
      alignSelf: "flex-start",
      backgroundColor: theme.tabRowBg,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    miniBadgeText: {
      color: theme.textPrimary,
      fontSize: 11,
      fontWeight: "700",
    },
    miniDotsArea: {
      flex: 1,
      alignItems: "stretch",
      justifyContent: "center",
      paddingVertical: 8,
    },
    miniTitle: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    miniSub: {
      color: theme.textSecondary,
      fontSize: 11,
      marginTop: 2,
    },
    statCard: {
      flex: 1.5,
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 14,
    },
    statCardPressed: {
      opacity: 0.7,
    },
    statBigRow: {
      flexDirection: "row",
      alignItems: "baseline",
      marginTop: "auto",
      paddingTop: 12,
    },
    statBigNum: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "700",
    },
    statBigDenom: {
      color: theme.textMuted,
      fontSize: 16,
      fontWeight: "600",
    },
    statBigPercent: {
      color: theme.accent,
      fontSize: 16,
      fontWeight: "700",
    },
    progressTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.tabRowBg,
      overflow: "hidden",
      marginTop: 4,
    },
    progressFill: {
      height: "100%",
      borderRadius: 5,
      backgroundColor: theme.accent,
    },
    statFooterLabel: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    statFooterStrong: {
      color: theme.textPrimary,
      fontWeight: "700",
    },
    recentHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    recentHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    recentAddBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    recentAddBtnPressed: {
      backgroundColor: theme.tabRowBg,
    },
    recentAddIcon: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 20,
      marginTop: -2,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 17,
      fontWeight: "800",
    },
    allLink: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: "700",
    },
    rowSep: { height: 1, backgroundColor: theme.cardBorder, marginLeft: 20 },
    recentRow: {
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
    recentMain: { flex: 1 },
    recentTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    recentName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    recentCode: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    recentBadge: {
      marginLeft: 6,
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
    recentDate: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    chev: {
      color: theme.textMuted,
      fontSize: 22,
      fontWeight: "400",
    },
    emptyWrap: {
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 13,
      textAlign: "center",
    },
  });
}

export type MainScreenStyles = ReturnType<typeof makeStyles>;
