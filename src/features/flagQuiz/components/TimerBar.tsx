import { View } from "react-native";

import { useTheme } from "../../../theme/themeStore";

// secondsLeft(0~total)를 가로 막대 너비로 표시한다. 3초 이하면 경고색.
export function TimerBar({
  secondsLeft,
  total,
}: {
  secondsLeft: number;
  total: number;
}) {
  const theme = useTheme();
  const ratio = Math.max(0, Math.min(1, secondsLeft / total));
  const warning = secondsLeft <= 3;
  return (
    <View
      style={{
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.cardBorder,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${ratio * 100}%`,
          backgroundColor: warning ? theme.dangerOn : theme.accent,
        }}
      />
    </View>
  );
}
