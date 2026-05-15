import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BarChart3, ChevronRight } from "lucide-react-native";

import { useTheme } from "../../../theme/themeStore";
import type { LeaderboardEntry } from "../scoreService";
import { TopThreeList } from "./TopThreeList";

// 시즌(주간) 리더보드 대기 화면. 카드 안에 내 최고 + 점선 + 이번 주 1·2·3위.
export function QuizStartView({
  bestScore,
  loading,
  signedIn,
  topThree,
  topLoading,
  currentUserId,
  onStart,
  onViewRanking,
}: {
  bestScore: number | null;
  loading: boolean;
  signedIn: boolean;
  topThree: LeaderboardEntry[];
  topLoading: boolean;
  currentUserId: string | null;
  onStart: () => void;
  onViewRanking: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 24, padding: 24 }}>
      <View style={{ alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: theme.textPrimary }}>
          {t("gamesHub.flagQuizTitle")}
        </Text>
        <Text style={{ fontSize: 15, color: theme.textSecondary, textAlign: "center" }}>
          {t("gamesHub.flagQuizDesc")}
        </Text>
      </View>

      <View
        style={{
          width: "100%",
          backgroundColor: theme.cardBg,
          borderRadius: 20,
          padding: 20,
          gap: 16,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 2,
        }}
      >
        <MyBest
          bestScore={bestScore}
          loading={loading}
          signedIn={signedIn}
        />

        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.cardBorder,
            borderStyle: "dashed",
          }}
        />

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: theme.textSecondary }}>
            {t("flagQuiz.thisWeekTop")}
          </Text>
          {topLoading ? (
            <View style={{ paddingVertical: 12, alignItems: "center" }}>
              <ActivityIndicator color={theme.accent} size="small" />
            </View>
          ) : (
            <TopThreeList entries={topThree} currentUserId={currentUserId} />
          )}
        </View>
      </View>

      <Pressable
        onPress={onStart}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          backgroundColor: theme.accent,
          paddingVertical: 16,
          paddingHorizontal: 48,
          borderRadius: 999,
          opacity: pressed ? 0.85 : 1,
          width: "100%",
        })}
      >
        <Text style={{ color: theme.accentOn, fontSize: 18, fontWeight: "800" }}>
          {t("flagQuiz.start")}
        </Text>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: theme.accentOn,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronRight color={theme.accent} size={18} />
        </View>
      </Pressable>

      <Pressable
        onPress={onViewRanking}
        hitSlop={8}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <BarChart3 color={theme.textSecondary} size={16} />
        <Text style={{ fontSize: 14, fontWeight: "700", color: theme.textSecondary }}>
          {t("flagQuiz.viewRanking")}
        </Text>
        <ChevronRight color={theme.textSecondary} size={14} />
      </Pressable>
    </View>
  );
}

// 내 최고 점수 영역. 트로피 이모지 + 라벨 + 큰 숫자 + 단위.
function MyBest({
  bestScore,
  loading,
  signedIn,
}: {
  bestScore: number | null;
  loading: boolean;
  signedIn: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Text style={{ fontSize: 36 }}>🏆</Text>
      <Text style={{ fontSize: 14, fontWeight: "700", color: theme.textSecondary }}>
        {t("flagQuiz.myBest")}
      </Text>
      {loading ? (
        <ActivityIndicator color={theme.accent} />
      ) : !signedIn ? (
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
          {t("flagQuiz.loginToSave")}
        </Text>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
          <Text style={{ fontSize: 40, fontWeight: "800", color: theme.accent }}>
            {bestScore ?? 0}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: theme.accent }}>
            {t("flagQuiz.scoreUnit")}
          </Text>
        </View>
      )}
    </View>
  );
}

