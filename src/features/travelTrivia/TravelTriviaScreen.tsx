import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { useAuthStore } from "../auth/authStore";
import { useTheme } from "../../theme/themeStore";
import { TimerBar } from "../flagQuiz/components/TimerBar";
import { QuestionCard } from "./components/QuestionCard";
import { TriviaChoiceButton, type TriviaChoiceState } from "./components/TriviaChoiceButton";
import { TriviaGameOverView } from "./components/TriviaGameOverView";
import { TriviaLivesIndicator } from "./components/TriviaLivesIndicator";
import { TriviaStartView } from "./components/TriviaStartView";
import {
  fetchMyTriviaScore,
  fetchTriviaLeaderboard,
  submitTriviaScore,
  type LeaderboardEntry,
} from "./scoreService";
import { QUESTION_SECONDS, useTravelTriviaGame } from "./useTravelTriviaGame";

export function TravelTriviaScreen({
  onClose,
  onViewRanking,
}: {
  onClose: () => void;
  onViewRanking: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const game = useTravelTriviaGame();

  const [bestScore, setBestScore] = useState<number | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [topThree, setTopThree] = useState<LeaderboardEntry[]>([]);
  const [loadingTop, setLoadingTop] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const submittedRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshMy = useCallback(() => {
    if (!userId) {
      setBestScore(null);
      return;
    }
    setLoadingScore(true);
    fetchMyTriviaScore().then((row) => {
      if (!mountedRef.current) return;
      setBestScore(row?.bestScore ?? null);
      setLoadingScore(false);
    });
  }, [userId]);

  const refreshTop = useCallback(() => {
    setLoadingTop(true);
    fetchTriviaLeaderboard(3).then((list) => {
      if (!mountedRef.current) return;
      setTopThree(list);
      setLoadingTop(false);
    });
  }, []);

  useEffect(() => {
    refreshMy();
    refreshTop();
  }, [refreshMy, refreshTop]);

  // 게임오버 시 점수 제출 + 갱신
  useEffect(() => {
    if (game.status !== "over" || submittedRef.current) return;
    submittedRef.current = true;
    const finalScore = game.score;
    const prevBest = bestScore ?? 0;
    setIsNewBest(finalScore > prevBest);
    if (userId) {
      submitTriviaScore(finalScore).then((row) => {
        if (!mountedRef.current) return;
        if (row) setBestScore(row.bestScore);
        refreshTop();
      });
    } else {
      refreshTop();
    }
  }, [game.status, game.score, userId, bestScore, refreshTop]);

  const handleStart = useCallback(() => {
    submittedRef.current = false;
    setIsNewBest(false);
    game.start();
  }, [game.start]);

  // 오답 시 강한 진동 3회.
  useEffect(() => {
    const reveal = game.reveal;
    if (!reveal || reveal.correct) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const t1 = setTimeout(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      80,
    );
    const t2 = setTimeout(
      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      160,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [game.reveal]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.homeBg }} edges={["top", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Pressable onPress={onClose} hitSlop={10} style={{ padding: 8 }}>
          <ChevronLeft color={theme.textPrimary} size={26} />
        </Pressable>
      </View>

      {game.status === "idle" ? (
        <>
          <TriviaStartView
            bestScore={bestScore}
            loading={loadingScore}
            signedIn={!!userId}
            topThree={topThree}
            topLoading={loadingTop}
            currentUserId={userId}
            onStart={handleStart}
            onViewRanking={onViewRanking}
          />
          {game.loadError ? (
            <Text style={{ textAlign: "center", color: theme.dangerOn, paddingBottom: 24 }}>
              {t("trivia.loadError")}
            </Text>
          ) : null}
        </>
      ) : game.status === "loading" ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color={theme.accent} />
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            {t("trivia.loadingQuestions")}
          </Text>
        </View>
      ) : game.status === "over" ? (
        <TriviaGameOverView
          score={game.score}
          bestScore={bestScore}
          isNewBest={isNewBest}
          onRetry={handleStart}
          onExit={onClose}
        />
      ) : game.current ? (
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TriviaLivesIndicator lives={game.lives} />
            <Text style={{ fontSize: 16, fontWeight: "800", color: theme.textPrimary }}>
              {t("trivia.score", { score: game.score })}
            </Text>
          </View>

          <TimerBar secondsLeft={game.secondsLeft} total={QUESTION_SECONDS} />

          <QuestionCard question={game.current.question} />

          <View style={{ gap: 12 }}>
            {game.current.choices.map((label, idx) => {
              let cState: TriviaChoiceState = "idle";
              if (game.reveal) {
                if (idx === game.reveal.answer) cState = "correct";
                else if (idx === game.reveal.selected) cState = "wrong";
                else cState = "dimmed";
              }
              return (
                <TriviaChoiceButton
                  key={idx}
                  label={label}
                  state={cState}
                  disabled={!!game.reveal}
                  onPress={() => game.select(idx)}
                />
              );
            })}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
