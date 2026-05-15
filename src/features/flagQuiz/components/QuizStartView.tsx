import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/themeStore";
import { flagEmoji } from "../../../utils/flag";
import type { TopQuizScore } from "../scoreService";

// 대기 화면. 내 최고 점수 + 전체 1위(닉네임 + 국기 + 동점자 수)를 같이 보여준다.
// topScore가 null이면 전체 1위 영역을 숨기고 내 점수만 보여준다.
export function QuizStartView({
  bestScore,
  loading,
  signedIn,
  topScore,
  topLoading,
  currentUserId,
  onStart,
}: {
  bestScore: number | null;
  loading: boolean;
  signedIn: boolean;
  topScore: TopQuizScore | null;
  topLoading: boolean;
  currentUserId: string | null;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  let myScoreLine: string;
  if (!signedIn) myScoreLine = t("flagQuiz.loginToSave");
  else if (loading) myScoreLine = t("flagQuiz.loadingScore");
  else if (bestScore != null && bestScore > 0)
    myScoreLine = `${t("flagQuiz.myBest")} ${bestScore}`;
  else myScoreLine = t("flagQuiz.noBestScore");

  const showTop = !topLoading && topScore != null;
  const topName = topScore?.nickname ?? t("flagQuiz.anonymousTraveler");
  const isMeOnTop =
    topScore != null && currentUserId != null && topScore.userId === currentUserId;
  const flag = topScore?.homeCountryCode ? flagEmoji(topScore.homeCountryCode) : null;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 24, padding: 24 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", color: theme.textPrimary }}>
        {t("gamesHub.flagQuizTitle")}
      </Text>
      <Text style={{ fontSize: 15, color: theme.textSecondary, textAlign: "center" }}>
        {t("gamesHub.flagQuizDesc")}
      </Text>

      <View style={{ gap: 10, minHeight: 60, justifyContent: "center", alignItems: "center" }}>
        {loading ? (
          <ActivityIndicator color={theme.accent} />
        ) : (
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.textPrimary }}>
            {myScoreLine}
          </Text>
        )}

        {topLoading ? (
          <ActivityIndicator color={theme.accent} size="small" />
        ) : showTop && topScore ? (
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "center", gap: 6 }}>
            <Text style={{ fontSize: 14, color: theme.textSecondary, fontWeight: "600" }}>
              {t("flagQuiz.topPlayer")}
            </Text>
            {flag ? <Text style={{ fontSize: 16 }}>{flag}</Text> : null}
            <Text style={{ fontSize: 14, fontWeight: "700", color: theme.textPrimary }}>
              {topName}
              {isMeOnTop ? ` ${t("flagQuiz.youSuffix")}` : ""}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: theme.accent }}>
              {topScore.bestScore}
            </Text>
            {topScore.tiedCount > 0 ? (
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                {t("flagQuiz.othersCount", { count: topScore.tiedCount })}
              </Text>
            ) : null}
          </View>
        ) : null}
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
