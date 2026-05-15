import { Pressable, Text } from "react-native";

import { useTheme } from "../../../theme/themeStore";

const CORRECT_BG = "#16a34a";
const WRONG_BG = "#dc2626";

export type TriviaChoiceState = "idle" | "correct" | "wrong" | "dimmed";

// flagQuiz의 ChoiceButton과 거의 동일하지만, 보기 텍스트가 길어질 수 있어
// numberOfLines를 2로 두고 폰트 자동 축소를 허용한다 (예: "Доминиканская Республика").
export function TriviaChoiceButton({
  label,
  state,
  disabled,
  onPress,
}: {
  label: string;
  state: TriviaChoiceState;
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
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        numberOfLines={2}
        style={{
          color: textColor,
          fontSize: 17,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
