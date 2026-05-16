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

// 처음 EASY_LEAD_COUNT개 문제는 난이도 1~2에서만 나오게 보장한다.
// 첫 문제부터 난이도 3이 튀어나와 진입장벽이 높아지는 걸 막기 위함.
const EASY_LEAD_COUNT = 5;

// 게임 1회분 문제를 DB에서 가져온다.
// p_locale은 현재 앱 locale, 해당 locale의 문제가 없으면 빈 배열 반환 — 그때는 en으로 한번 더 시도한다.
export async function fetchTriviaQuestions(count = 30): Promise<TriviaQuestion[]> {
  const locale = getCurrentLocale();
  const first = await rpc(locale, count);
  if (first.length > 0) return reorderEasyFirst(first);
  if (locale !== "en") return reorderEasyFirst(await rpc("en", count));
  return [];
}

// RPC는 이미 random 순서로 반환한다. 그 순서를 훑으며 처음 등장하는 난이도 ≤ 2 문제를
// 앞으로 EASY_LEAD_COUNT개까지 끌어올리고, 나머지는 원래 random 순서를 유지한다.
function reorderEasyFirst(questions: TriviaQuestion[]): TriviaQuestion[] {
  const front: TriviaQuestion[] = [];
  const rest: TriviaQuestion[] = [];
  for (const q of questions) {
    if (front.length < EASY_LEAD_COUNT && q.difficulty <= 2) {
      front.push(q);
    } else {
      rest.push(q);
    }
  }
  return [...front, ...rest];
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
