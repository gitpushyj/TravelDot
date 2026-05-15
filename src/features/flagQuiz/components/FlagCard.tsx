import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import * as Flags from "country-flag-icons/string/3x2";

import { useTheme } from "../../../theme/themeStore";

const FLAGS = Flags as unknown as Record<string, string>;

// 3x2 비율 국기를 SVG로 그린다. 코드에 해당하는 국기가 없으면 빈 박스.
export function FlagCard({ code, width }: { code: string; width: number }) {
  const theme = useTheme();
  const height = Math.round((width * 2) / 3);
  const xml = FLAGS[code];
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: theme.flagBoxBg,
        borderWidth: 1,
        borderColor: theme.cardBorder,
      }}
    >
      {xml ? <SvgXml xml={xml} width={width} height={height} /> : null}
    </View>
  );
}
