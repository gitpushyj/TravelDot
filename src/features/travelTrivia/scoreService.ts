import { supabase } from "../../lib/supabase";

// 시즌은 KST 월요일 00:00 ~ 일요일 24:00로 자동 갱신. 모든 함수는 "이번 주" 기준.

export type QuizScore = {
  bestScore: number;
  lastScore: number;
};

export type LeaderboardEntry = {
  rank: number;
  bestScore: number;
  nickname: string | null;
  homeCountryCode: string | null;
  userId: string;
};

export type MyRank = {
  rank: number;
  bestScore: number;
};

export async function fetchMyTriviaScore(): Promise<QuizScore | null> {
  const { data, error } = await supabase.rpc("get_my_travel_trivia_score");
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    bestScore: (row.best_score as number | null) ?? 0,
    lastScore: (row.last_score as number | null) ?? 0,
  };
}

export async function submitTriviaScore(score: number): Promise<QuizScore | null> {
  const { data, error } = await supabase.rpc("submit_travel_trivia_score", {
    p_score: score,
  });
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    bestScore: (row.best_score as number | null) ?? 0,
    lastScore: (row.last_score as number | null) ?? 0,
  };
}

export async function fetchTriviaLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc("get_travel_trivia_leaderboard", {
    p_limit: limit,
  });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    rank: (row.rank as number | null) ?? 0,
    bestScore: (row.best_score as number | null) ?? 0,
    nickname: (row.nickname as string | null) ?? null,
    homeCountryCode: (row.home_country_code as string | null) ?? null,
    userId: row.user_id as string,
  }));
}

export async function fetchMyTriviaRank(): Promise<MyRank | null> {
  const { data, error } = await supabase.rpc("get_my_travel_trivia_rank");
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    rank: (row.rank as number | null) ?? 0,
    bestScore: (row.best_score as number | null) ?? 0,
  };
}
