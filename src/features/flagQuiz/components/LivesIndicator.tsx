import { View } from "react-native";
import { Heart } from "lucide-react-native";

import { INITIAL_LIVES } from "../gameMachine";
import { useTheme } from "../../../theme/themeStore";

// 남은 목숨을 하트로 표시한다. 잃은 목숨은 흐린 외곽선 하트.
export function LivesIndicator({ lives }: { lives: number }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {Array.from({ length: INITIAL_LIVES }).map((_, i) => {
        const filled = i < lives;
        return (
          <Heart
            key={i}
            size={22}
            color={filled ? theme.dangerOn : theme.textMuted}
            fill={filled ? theme.dangerOn : "transparent"}
          />
        );
      })}
    </View>
  );
}
