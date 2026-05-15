import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/themeStore";

export function TriviaGameOverView({
  score,
  bestScore,
  isNewBest,
  onRetry,
  onExit,
}: {
  score: number;
  bestScore: number | null;
  isNewBest: boolean;
  onRetry: () => void;
  onExit: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: theme.textPrimary }}>
        {t("trivia.gameOver")}
      </Text>
      <Text style={{ fontSize: 40, fontWeight: "900", color: theme.accent }}>
        {t("trivia.finalScore", { score })}
      </Text>
      {isNewBest ? (
        <Text style={{ fontSize: 16, fontWeight: "800", color: theme.accent }}>
          {t("trivia.newBest")}
        </Text>
      ) : bestScore != null ? (
        <Text style={{ fontSize: 15, color: theme.textSecondary }}>
          {t("trivia.bestScoreLabel", { score: bestScore })}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => ({
            backgroundColor: theme.accent,
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 14,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: theme.accentOn, fontSize: 16, fontWeight: "800" }}>
            {t("trivia.retry")}
          </Text>
        </Pressable>
        <Pressable
          onPress={onExit}
          style={({ pressed }) => ({
            backgroundColor: theme.optionBtnBg,
            borderWidth: 1,
            borderColor: theme.optionBtnBorder,
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 14,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "800" }}>
            {t("trivia.exit")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
