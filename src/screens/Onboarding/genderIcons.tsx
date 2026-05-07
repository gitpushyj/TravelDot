import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

import type { Gender } from "../../features/onboarding/profileStore";

type Props = { color: string; size?: number };

export function GenderIcon({ gender: _gender, ...props }: Props & { gender: Gender }) {
  // 현재 male/female 두 옵션만 같은 person 아이콘을 사용한다. 향후 카테고리가
  // 분리되면 switch로 다시 분기하면 된다.
  return <PersonIcon {...props} />;
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
