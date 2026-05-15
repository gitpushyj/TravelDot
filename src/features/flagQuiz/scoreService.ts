import { supabase } from "../../lib/supabase";

// 시즌은 KST 월요일 00:00 ~ 일요일 24:00로 자동 갱신. 모든 함수는 "이번 주" 기준.

export type QuizScore = {
  bestScore: number;
  lastScore: number;
};

// 리더보드 1행. dense_rank로 동점자는 같은 rank를 가진다.
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

// 이번 주 내 점수 조회. 비로그인이면 null. 행이 없으면 best=0.
export async function fetchMyQuizScore(): Promise<QuizScore | null> {
  const { data, error } = await supabase.rpc("get_my_flag_quiz_score");
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    bestScore: (row.best_score as number | null) ?? 0,
    lastScore: (row.last_score as number | null) ?? 0,
  };
}

// 게임 종료 점수 제출. 이번 주 (user_id, week_start) 행에 upsert.
export async function submitQuizScore(score: number): Promise<QuizScore | null> {
  const { data, error } = await supabase.rpc("submit_flag_quiz_score", {
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

// 이번 주 리더보드 1 ~ p_limit위. 동점자는 같은 rank (dense_rank).
export async function fetchLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc("get_flag_quiz_leaderboard", {
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

// 이번 주 본인 등수. 행이 없거나 비로그인이면 null.
export async function fetchMyRank(): Promise<MyRank | null> {
  const { data, error } = await supabase.rpc("get_my_flag_quiz_rank");
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    rank: (row.rank as number | null) ?? 0,
    bestScore: (row.best_score as number | null) ?? 0,
  };
}
