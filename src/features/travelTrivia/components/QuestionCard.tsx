import { Text, View } from "react-native";

import { useTheme } from "../../../theme/themeStore";

// 문제 본문 카드. 글자 크기는 길이에 따라 자동으로 약간 줄어들도록 minimumFontScale 사용.
export function QuestionCard({ question }: { question: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.cardBg,
        borderRadius: 20,
        padding: 24,
        minHeight: 160,
        justifyContent: "center",
        borderWidth: 1,
        borderColor: theme.cardBorder,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        numberOfLines={5}
        style={{
          color: theme.textPrimary,
          fontSize: 20,
          fontWeight: "800",
          textAlign: "center",
          lineHeight: 28,
        }}
      >
        {question}
      </Text>
    </View>
  );
}
