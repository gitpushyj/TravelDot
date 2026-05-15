import { getCurrentLocale } from "../../i18n";
import { supabase } from "../../lib/supabase";

export type TriviaQuestion = {
  id: number;
  category: string;
  difficulty: number;
  question: string;
  choices: string[];
  correctIndex: number;
};

// 게임 1회분 문제를 DB에서 가져온다.
// p_locale은 현재 앱 locale, 해당 locale의 문제가 없으면 빈 배열 반환 — 그때는 en으로 한번 더 시도한다.
export async function fetchTriviaQuestions(count = 30): Promise<TriviaQuestion[]> {
  const locale = getCurrentLocale();
  const first = await rpc(locale, count);
  if (first.length > 0) return first;
  if (locale !== "en") return rpc("en", count);
  return [];
}

async function rpc(locale: string, count: number): Promise<TriviaQuestion[]> {
  const { data, error } = await supabase.rpc("get_travel_trivia_questions", {
    p_locale: locale,
    p_count: count,
  });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as number,
    category: row.category as string,
    difficulty: row.difficulty as number,
    question: row.question as string,
    choices: (row.choices as string[]) ?? [],
    correctIndex: row.correct_index as number,
  }));
}
