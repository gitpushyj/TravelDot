import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  STAGE_VISUALS,
  type MedalConfig,
} from "../../features/badges/badgeVisuals";

type Props = {
  config: MedalConfig;
  size?: number;
  locked?: boolean;
};

export default function BadgeMedal({
  config,
  size = 40,
  locked = false,
}: Props) {
  const stage = STAGE_VISUALS[config.stage];
  const color = locked ? "#9ca3af" : stage.color;
  const bg = locked ? "rgba(127,127,127,0.10)" : stage.tintBg;

  const glowStyle =
    !locked && stage.glow > 0
      ? {
          shadowColor: stage.color,
          shadowOpacity: 0.35 + stage.glow * 0.18,
          shadowRadius: 4 + stage.glow * 3,
          shadowOffset: { width: 0, height: 0 },
          elevation: 3 + stage.glow * 2,
        }
      : null;

  const containerStyle = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderColor: color,
      backgroundColor: bg,
      opacity: locked ? 0.6 : 1,
    },
    glowStyle,
  ];

  if (config.content.kind === "icon") {
    const Icon = config.content.Icon;
    const iconSize = Math.round(size * 0.55);
    return (
      <View style={containerStyle}>
        <Icon size={iconSize} color={color} strokeWidth={2.2} />
      </View>
    );
  }

  const emojiSize = Math.round(size * 0.5);
  return (
    <View style={containerStyle}>
      <Text style={{ fontSize: emojiSize, opacity: locked ? 0.45 : 1 }}>
        {config.content.emoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
});
