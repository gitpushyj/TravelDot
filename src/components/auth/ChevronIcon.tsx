import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = { size?: number; color?: string };

export default function ChevronIcon({ size = 18, color = "#9a948a" }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
