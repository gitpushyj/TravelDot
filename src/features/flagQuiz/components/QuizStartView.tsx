import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/themeStore";

// 대기 화면. bestScore: 로그인 사용자의 최고 점수(없으면 null).
// loading: 점수 조회 중. signedIn: 로그인 여부.
export function QuizStartView({
  bestScore,
  loading,
  signedIn,
  onStart,
}: {
  bestScore: number | null;
  loading: boolean;
  signedIn: boolean;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  let scoreLine: string;
  if (!signedIn) scoreLine = t("flagQuiz.loginToSave");
  else if (loading) scoreLine = t("flagQuiz.loadingScore");
  else if (bestScore != null && bestScore > 0)
    scoreLine = t("flagQuiz.bestScore", { score: bestScore });
  else scoreLine = t("flagQuiz.noBestScore");

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 28, padding: 24 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: theme.textPrimary }}>
        {t("gamesHub.flagQuizTitle")}
      </Text>
      <Text style={{ fontSize: 15, color: theme.textSecondary, textAlign: "center" }}>
        {t("gamesHub.flagQuizDesc")}
      </Text>
      <View style={{ height: 22, justifyContent: "center" }}>
        {loading ? (
          <ActivityIndicator color={theme.accent} />
        ) : (
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.textPrimary }}>
            {scoreLine}
          </Text>
        )}
      </View>
      <Pressable
        onPress={onStart}
        style={({ pressed }) => ({
          backgroundColor: theme.accent,
          paddingVertical: 16,
          paddingHorizontal: 48,
          borderRadius: 16,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: theme.accentOn, fontSize: 18, fontWeight: "800" }}>
          {t("flagQuiz.start")}
        </Text>
      </Pressable>
    </View>
  );
}
