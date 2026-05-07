import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mapArea: {
    width: "100%",
    aspectRatio: 360 / 145,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  // 한 도트가 여러 나라에 걸쳐 있을 때 노출되는 선택 UI. 지도 영역 크기에
   // 영향을 주지 않도록 절대 위치 오버레이로 띄운다.
  caption: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  captionLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
