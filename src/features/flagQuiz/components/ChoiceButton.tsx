import { Pressable, Text } from "react-native";

import { useTheme } from "../../../theme/themeStore";

// 정답/오답 피드백 색 (테마 토큰에 green 계열이 없어 컴포넌트 로컬 상수로 둔다).
const CORRECT_BG = "#16a34a";
const WRONG_BG = "#dc2626";

export type ChoiceState = "idle" | "correct" | "wrong" | "dimmed";

export function ChoiceButton({
  label,
  state,
  disabled,
  onPress,
}: {
  label: string;
  state: ChoiceState;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  let bg = theme.optionBtnBg;
  let border = theme.optionBtnBorder;
  let textColor = theme.textPrimary;
  if (state === "correct") {
    bg = CORRECT_BG;
    border = CORRECT_BG;
    textColor = "#ffffff";
  } else if (state === "wrong") {
    bg = WRONG_BG;
    border = WRONG_BG;
    textColor = "#ffffff";
  } else if (state === "dimmed") {
    textColor = theme.textMuted;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: border,
        backgroundColor:
          pressed && state === "idle" ? theme.optionBtnPressedBg : bg,
        opacity: state === "dimmed" ? 0.5 : 1,
      })}
    >
      <Text
        style={{
          color: textColor,
          fontSize: 17,
          fontWeight: "700",
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
