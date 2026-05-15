import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { getCountryName } from "../../lib/countryName";
import { getCurrentLocale } from "../../i18n";
import { useAuthStore } from "../auth/authStore";
import { useTheme } from "../../theme/themeStore";
import { ChoiceButton, type ChoiceState } from "./components/ChoiceButton";
import { FlagCard } from "./components/FlagCard";
import { GameOverView } from "./components/GameOverView";
import { LivesIndicator } from "./components/LivesIndicator";
import { QuizStartView } from "./components/QuizStartView";
import { TimerBar } from "./components/TimerBar";
import { fetchMyQuizScore, fetchTopQuizScore, submitQuizScore, type TopQuizScore } from "./scoreService";
import { QUESTION_SECONDS, useFlagQuizGame } from "./useFlagQuizGame";

export function FlagQuizScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const game = useFlagQuizGame();

  const [bestScore, setBestScore] = useState<number | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [topScore, setTopScore] = useState<TopQuizScore | null>(null);
  const [loadingTop, setLoadingTop] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  // 이번 게임오버 처리(점수 제출)를 1회만 하기 위한 가드.
  const submittedRef = useRef(false);

  // 대기 화면 진입 시 내 최고 점수 조회.
  useEffect(() => {
    if (!userId) {
      setBestScore(null);
      return;
    }
    let cancelled = false;
    setLoadingScore(true);
    fetchMyQuizScore(userId).then((row) => {
      if (cancelled) return;
      setBestScore(row?.bestScore ?? null);
      setLoadingScore(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 전체 1위 조회. 시작화면 진입과 게임오버 직후에 다시 갱신해서
  // 본인이 갓 신기록을 세웠을 때도 1위 라인이 즉시 반영되도록 한다.
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const refreshTop = useCallback(() => {
    setLoadingTop(true);
    fetchTopQuizScore().then((row) => {
      if (!mountedRef.current) return;
      setTopScore(row);
      setLoadingTop(false);
    });
  }, []);

  useEffect(() => {
    refreshTop();
  }, [refreshTop]);

  // 게임오버 전이 시 점수 제출 (로그인 사용자만, 1회). 제출 후 전체 1위 재조회.
  useEffect(() => {
    if (game.status !== "over" || submittedRef.current) return;
    submittedRef.current = true;
    const finalScore = game.score;
    const prevBest = bestScore ?? 0;
    setIsNewBest(finalScore > prevBest);
    if (userId) {
      submitQuizScore(finalScore).then((row) => {
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

  const handleSelect = useCallback(
    (code: string) => {
      if (game.reveal) return;
      game.select(code);
    },
    [game.reveal, game.select],
  );

  // reveal 변화를 감지해 오답일 때만 강한 진동을 발화한다.
  // timeout(자동 오답)도 reveal이 생기는 동일 경로라 자동 통합된다.
  // Heavy impact를 짧은 간격으로 3회 발사해 체감 강도를 높인다.
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

  const locale = getCurrentLocale();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.homeBg }} edges={["top", "bottom"]}>
      {/* 헤더 */}
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
        <QuizStartView
          bestScore={bestScore}
          loading={loadingScore}
          signedIn={!!userId}
          topScore={topScore}
          topLoading={loadingTop}
          currentUserId={userId}
          onStart={handleStart}
        />
      ) : game.status === "over" ? (
        <GameOverView
          score={game.score}
          bestScore={bestScore}
          isNewBest={isNewBest}
          onRetry={handleStart}
          onExit={onClose}
        />
      ) : game.current ? (
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          {/* 상단: 목숨 + 점수 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <LivesIndicator lives={game.lives} />
            <Text style={{ fontSize: 16, fontWeight: "800", color: theme.textPrimary }}>
              {t("flagQuiz.score", { score: game.score })}
            </Text>
          </View>

          <TimerBar secondsLeft={game.secondsLeft} total={QUESTION_SECONDS} />

          {/* 국기 */}
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <FlagCard code={game.current.answerCode} width={220} />
          </View>

          {/* 4지선다 */}
          <View style={{ gap: 12 }}>
            {game.current.choices.map((code) => {
              let cState: ChoiceState = "idle";
              if (game.reveal) {
                if (code === game.reveal.answer) cState = "correct";
                else if (code === game.reveal.selected) cState = "wrong";
                else cState = "dimmed";
              }
              return (
                <ChoiceButton
                  key={code}
                  label={getCountryName(code, locale)}
                  state={cState}
                  disabled={!!game.reveal}
                  onPress={() => handleSelect(code)}
                />
              );
            })}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
