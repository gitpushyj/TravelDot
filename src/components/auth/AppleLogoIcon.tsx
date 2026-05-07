import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = { size?: number; color?: string };

// Apple HIG의 Sign in with Apple 가이드라인이 사용하는 표준 Apple 심볼.
// 검정 버튼에서는 color="#FFFFFF", 흰 버튼에서는 "#000000"로 사용한다.
export default function AppleLogoIcon({ size = 18, color = "#FFFFFF" }: Props) {
  return (
    <Svg width={size} height={size * (24 / 22)} viewBox="0 0 22 24" fill="none">
      <Path
        fill={color}
        d="M17.05 12.04c-.03-3.13 2.55-4.63 2.66-4.71-1.45-2.13-3.71-2.42-4.51-2.45-1.92-.19-3.74 1.13-4.71 1.13s-2.46-1.1-4.05-1.07c-2.08.03-4.02 1.21-5.09 3.07-2.18 3.78-.55 9.36 1.55 12.43 1.06 1.5 2.31 3.18 3.96 3.12 1.6-.07 2.2-1.03 4.13-1.03s2.47 1.03 4.16.99c1.72-.03 2.81-1.5 3.86-3.02 1.22-1.73 1.71-3.41 1.74-3.5-.04-.02-3.34-1.27-3.7-5.04zm-3.1-9.27c.86-1.05 1.45-2.5 1.29-3.95-1.25.05-2.78.84-3.67 1.88-.78.93-1.49 2.42-1.31 3.83 1.4.11 2.83-.71 3.69-1.76z"
      />
    </Svg>
  );
}
