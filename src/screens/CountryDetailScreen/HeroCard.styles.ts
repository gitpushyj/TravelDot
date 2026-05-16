import { StyleSheet } from "react-native";

const WHITE_PRIMARY = "#FFFFFF";
const WHITE_SECONDARY = "rgba(255,255,255,0.7)";
const WHITE_LABEL = "rgba(255,255,255,0.75)";
const DIVIDER = "rgba(255,255,255,0.25)";

export const heroStyles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    marginBottom: 28,
    minHeight: 320,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    minHeight: 180,
  },
  textArea: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    color: WHITE_PRIMARY,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
  },
  code: {
    color: WHITE_SECONDARY,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 1,
  },
  dotArea: {
    width: "55%",
    aspectRatio: 1,
    alignSelf: "flex-start",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  statIconWrap: {
    marginBottom: 6,
  },
  statNum: {
    color: WHITE_PRIMARY,
    fontSize: 26,
    fontWeight: "800",
  },
  statLabel: {
    color: WHITE_LABEL,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: DIVIDER,
  },
});

export const HERO_DOT_COLOR = "rgba(255,255,255,0.95)";
