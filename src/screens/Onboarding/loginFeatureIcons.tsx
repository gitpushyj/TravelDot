import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = { size?: number; color: string };

export function PhotoFeatureIcon({ size = 28, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect x={3} y={6} width={22} height={17} rx={3} stroke={color} strokeWidth={2} />
      <Circle cx={14} cy={15} r={4} stroke={color} strokeWidth={2} />
      <Path d="M9 6l1.5-2h7L19 6" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

export function MapFeatureIcon({ size = 28, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M3 7l7-3 8 3 7-3v17l-7 3-8-3-7 3V7z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M10 4v17M18 7v17" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function LockFeatureIcon({ size = 28, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect x={5} y={12} width={18} height={12} rx={2.5} stroke={color} strokeWidth={2} />
      <Path
        d="M9 12V9a5 5 0 0110 0v3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={14} cy={18} r={1.6} fill={color} />
    </Svg>
  );
}
