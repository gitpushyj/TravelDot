import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { fetchLeaderboard, fetchMyQuizScore } from "../../features/flagQuiz/scoreService";
import {
  fetchTriviaLeaderboard,
  fetchMyTriviaScore,
} from "../../features/travelTrivia/scoreService";

export type GamesHubScores = {
  flagTop: number | null;
  flagMyBest: number | null;
  triviaTop: number | null;
  triviaMyBest: number | null;
};

const INITIAL: GamesHubScores = {
  flagTop: null,
  flagMyBest: null,
  triviaTop: null,
  triviaMyBest: null,
};

// 4개 RPC를 병렬로 호출. 한 호출이 실패해도 나머지 칸은 정상 표시.
// 0점 또는 row 없음은 null로 정규화 — UI에서 "-"로 표시된다.
export function useGamesHubScores(): GamesHubScores {
  const [scores, setScores] = useState<GamesHubScores>(INITIAL);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const [flagTopRes, flagMineRes, triviaTopRes, triviaMineRes] = await Promise.allSettled([
      fetchLeaderboard(1),
      fetchMyQuizScore(),
      fetchTriviaLeaderboard(1),
      fetchMyTriviaScore(),
    ]);
    if (!isMountedRef.current) return;

    const pickTop = (
      res: PromiseSettledResult<Array<{ bestScore: number }>>,
    ): number | null => {
      if (res.status !== "fulfilled") return null;
      const best = res.value[0]?.bestScore ?? 0;
      return best > 0 ? best : null;
    };
    const pickMine = (
      res: PromiseSettledResult<{ bestScore: number } | null>,
    ): number | null => {
      if (res.status !== "fulfilled" || !res.value) return null;
      return res.value.bestScore > 0 ? res.value.bestScore : null;
    };

    setScores({
      flagTop: pickTop(flagTopRes),
      flagMyBest: pickMine(flagMineRes),
      triviaTop: pickTop(triviaTopRes),
      triviaMyBest: pickMine(triviaMineRes),
    });
  }, []);

  // 화면 mount + focus 복귀 시마다 fresh fetch (게임 풀고 돌아오면 즉시 갱신).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return scores;
}
