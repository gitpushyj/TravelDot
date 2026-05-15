import { Pressable, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { useTheme } from "../../theme/themeStore";

// 게임 허브의 게임 1개 카드.
export function GameCard({
  icon: Icon,
  title,
  description,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        padding: 18,
        borderRadius: 16,
        backgroundColor: theme.cardBg,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.accentSoftBg,
        }}
      >
        <Icon color={theme.accent} size={26} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, fontWeight: "800", color: theme.textPrimary }}>
          {title}
        </Text>
        <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 2 }}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
