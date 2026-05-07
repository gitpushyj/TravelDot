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
  caption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
