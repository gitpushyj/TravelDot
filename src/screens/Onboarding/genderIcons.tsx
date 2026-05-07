import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

import type { Gender } from "../../features/onboarding/profileStore";

type Props = { color: string; size?: number };

export function GenderIcon({ gender, ...props }: Props & { gender: Gender }) {
  switch (gender) {
    case "male":
    case "female":
      return <PersonIcon {...props} />;
    case "other":
      return <SmileyIcon {...props} />;
    case "prefer_not_to_say":
      return <ForbiddenIcon {...props} />;
  }
}

function PersonIcon({ color, size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle
        cx={12}
        cy={8}
        r={4}
        stroke={color}
        strokeWidth={1.8}
        fill="none"
      />
      <Path
        d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"
        stroke={color}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SmileyIcon({ color, size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle
        cx={12}
        cy={12}
        r={9}
        stroke={color}
        strokeWidth={1.8}
        fill="none"
      />
      <Circle cx={9} cy={10} r={1} fill={color} />
      <Circle cx={15} cy={10} r={1} fill={color} />
      <Path
        d="M8.5 14.5c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2"
        stroke={color}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ForbiddenIcon({ color, size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle
        cx={12}
        cy={12}
        r={9}
        stroke={color}
        strokeWidth={1.8}
        fill="none"
      />
      <Path
        d="M5.6 5.6l12.8 12.8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
