import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = { size?: number; color: string };

// 분석 단계 카드 좌측 아이콘. 색은 호출 측이 결정한다.
export function CalendarMetaIcon({ size = 22, color }: Props) {
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
      <Path d="M3.5 10h17" stroke={color} strokeWidth={2} />
      <Path
        d="M8 3.5v3M16 3.5v3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Rect x={6.5} y={12.5} width={3} height={3} rx={0.5} fill={color} />
    </Svg>
  );
}

export function PinTripIcon({ size = 22, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5c-3.9 0-7 3.1-7 7 0 5.2 7 12 7 12s7-6.8 7-12c0-3.9-3.1-7-7-7z"
        fill={color}
      />
      <Circle cx={12} cy={9.6} r={2.5} fill="#ffffff" />
    </Svg>
  );
}

export function BrushMapIcon({ size = 22, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 3.5l6.5 6.5-9 9c-1.8 1.8-4.7 1.8-6.5 0s-1.8-4.7 0-6.5l9-9z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M5.5 19.5l-2 2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M11 6.5l6.5 6.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
