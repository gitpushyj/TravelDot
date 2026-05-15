import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/themeStore";

// 게임 오버 화면. score: 이번 점수. bestScore: 갱신된 최고(없으면 null).
// isNewBest: 이번 게임이 최고 기록을 경신했는지.
export function GameOverView({
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
        {t("flagQuiz.gameOver")}
      </Text>
      <Text style={{ fontSize: 40, fontWeight: "900", color: theme.accent }}>
        {t("flagQuiz.finalScore", { score })}
      </Text>
      {isNewBest ? (
        <Text style={{ fontSize: 16, fontWeight: "800", color: theme.accent }}>
          {t("flagQuiz.newBest")}
        </Text>
      ) : bestScore != null ? (
        <Text style={{ fontSize: 15, color: theme.textSecondary }}>
          {t("flagQuiz.bestScoreLabel", { score: bestScore })}
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
            {t("flagQuiz.retry")}
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
            {t("flagQuiz.exit")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
