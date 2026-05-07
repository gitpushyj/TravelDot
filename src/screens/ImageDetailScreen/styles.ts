import { Dimensions, StyleSheet } from "react-native";

export const SCREEN_WIDTH = Dimensions.get("window").width;
export const SCREEN_HEIGHT = Dimensions.get("window").height;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlayHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPressed: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  iconBtnText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
  },
  headerFlag: {
    fontSize: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  headerCounter: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  headerRightSpacer: {
    width: 40,
  },
  overlayCaption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  captionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
