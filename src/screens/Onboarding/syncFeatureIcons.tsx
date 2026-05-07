import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type Props = { size?: number; color: string };

// SyncStep 카드용 아이콘. 색상은 호출 측이 카드 톤(주황/녹/청)을 정한다.
export function PhotoSyncIcon({ size = 26, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect x={3} y={6} width={22} height={17} rx={3} stroke={color} strokeWidth={2} />
      <Path d="M9 6l1.5-2h7L19 6" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path
        d="M5 19l5-5 4 4 4-3 5 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={11} cy={12} r={1.6} fill={color} />
    </Svg>
  );
}

export function ShieldSyncIcon({ size = 26, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M14 3l9 4v6c0 6-4 10-9 12-5-2-9-6-9-12V7l9-4z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M9.5 14l3 3 6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrashSyncIcon({ size = 26, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M5 8h18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M10 8V5.5A1.5 1.5 0 0111.5 4h5A1.5 1.5 0 0118 5.5V8"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M7 8l1.2 14.2A2 2 0 0010.2 24h7.6a2 2 0 002-1.8L21 8"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M12 12v8M16 12v8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
