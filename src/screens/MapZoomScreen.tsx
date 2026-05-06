import { StatusBar } from "expo-status-bar";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import DotMap from "../components/DotMap";
import { useVisitStore } from "../features/travel/visitStore";
import { CARD_BG, HOME_BG, TEXT_PRIMARY } from "../utils/heatmap";

type Props = {
  visitCounts: Record<string, number>;
  onClose: () => void;
};

// 앱이 portrait로 잠겨 있어 화면 자체는 회전하지 않는다. 컨텐츠를 90도 회전시켜
// 사용자가 디바이스를 가로로 돌렸을 때 가로로 꽉 차는 형태로 보이도록 한다.
export default function MapZoomScreen({ visitCounts, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const selectedCountry = useVisitStore((s) => s.selectedCountry);

  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);

  return (
    <View style={[styles.outer, { width, height }]}>
      <StatusBar hidden />
      <View
        style={[
          styles.rotated,
          {
            width: longEdge,
            height: shortEdge,
            top: (height - shortEdge) / 2,
            left: (width - longEdge) / 2,
          },
        ]}
      >
        <DotMap
          visitCounts={visitCounts}
          autoPickFirst
          mapAreaStyle={{ width: longEdge, height: shortEdge }}
        />
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && styles.closeBtnPressed,
          ]}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        {selectedCountry && (
          <View pointerEvents="none" style={styles.bottomOverlay}>
            <View style={styles.namePill}>
              <Text style={styles.nameText} numberOfLines={1}>
                {selectedCountry.name}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: HOME_BG,
    overflow: "hidden",
  },
  rotated: {
    position: "absolute",
    backgroundColor: HOME_BG,
    transform: [{ rotate: "90deg" }],
  },
  closeBtn: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  closeBtnPressed: {
    opacity: 0.7,
  },
  closeIcon: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: "700",
  },
  bottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
  },
  namePill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(26, 26, 26, 0.85)",
    borderRadius: 999,
    maxWidth: "80%",
  },
  nameText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
