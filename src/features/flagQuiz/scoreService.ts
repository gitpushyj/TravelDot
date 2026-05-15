import { supabase } from "../../lib/supabase";

export type QuizScore = {
  bestScore: number;
  lastScore: number;
};

// 전체 유저 1위. 동점자가 있으면 먼저 달성한 1명 + tiedCount = 나머지 수.
// 닉네임/국가 코드는 NULL 가능 → 클라이언트에서 fallback 처리.
export type TopQuizScore = {
  bestScore: number;
  nickname: string | null;
  homeCountryCode: string | null;
  userId: string;
  tiedCount: number;
};

// 본인 점수 행 조회. 행이 없거나 에러면 null (비로그인/오프라인 정상 시나리오).
export async function fetchMyQuizScore(userId: string): Promise<QuizScore | null> {
  const { data, error } = await supabase
    .from("flag_quiz_scores")
    .select("best_score,last_score")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    bestScore: (data.best_score as number | null) ?? 0,
    lastScore: (data.last_score as number | null) ?? 0,
  };
}

// 게임 종료 점수 제출. RPC가 last는 항상, best는 greatest로 원자적 upsert 후
// 갱신된 행을 돌려준다. 에러면 null (게임 흐름에 영향 주지 않음).
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

// 전체 1위 조회. 행이 없거나 에러면 null (아직 기록 없음 또는 오프라인).
export async function fetchTopQuizScore(): Promise<TopQuizScore | null> {
  const { data, error } = await supabase.rpc("get_top_flag_quiz_score");
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    bestScore: (row.best_score as number | null) ?? 0,
    nickname: (row.nickname as string | null) ?? null,
    homeCountryCode: (row.home_country_code as string | null) ?? null,
    userId: row.user_id as string,
    tiedCount: (row.tied_count as number | null) ?? 0,
  };
}
