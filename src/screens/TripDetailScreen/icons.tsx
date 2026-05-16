import React from "react";
import Svg, { Path, Rect, Circle } from "react-native-svg";

type IconProps = {
  size?: number;
  color: string;
};

export function BagIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 7V5.5A2.5 2.5 0 0 1 11.5 3h1A2.5 2.5 0 0 1 15 5.5V7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Rect
        x={4}
        y={7}
        width={16}
        height={13}
        rx={2.5}
        fill={color}
      />
    </Svg>
  );
}

export function PhotoFrameIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={5}
        width={18}
        height={14}
        rx={2.5}
        stroke={color}
        strokeWidth={2}
      />
      <Circle cx={9} cy={10} r={1.5} fill={color} />
      <Path
        d="M4.5 17.5L9.5 13l3 3 3.5-3.5 4 4.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CalendarIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3.5}
        y={5}
        width={17}
        height={15}
        rx={2.5}
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M3.5 10h17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M8 3v4M16 3v4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Rect x={7} y={13} width={3} height={3} rx={0.5} fill={color} />
    </Svg>
  );
}
