import React from "react";
import { StyleSheet, View } from "react-native";

import type { TierVisual } from "../../features/travel/tierVisuals";

type Props = {
  visual: TierVisual;
  size?: number;
  locked?: boolean;
};

export default function TierBadgeIcon({
  visual,
  size = 40,
  locked = false,
}: Props) {
  const Icon = visual.Icon;
  const iconSize = Math.round(size * 0.55);
  const color = locked ? "#9ca3af" : visual.color;
  const bg = locked ? "rgba(127,127,127,0.10)" : visual.tintBg;

  const glowStyle =
    !locked && visual.glow > 0
      ? {
          shadowColor: visual.color,
          shadowOpacity: 0.35 + visual.glow * 0.18,
          shadowRadius: 4 + visual.glow * 3,
          shadowOffset: { width: 0, height: 0 },
          elevation: 3 + visual.glow * 2,
        }
      : null;

  return (
    <View
      style={[
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
      ]}
    >
      <Icon size={iconSize} color={color} strokeWidth={2.2} />
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
