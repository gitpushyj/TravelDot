import type { TriviaQuestion } from "./questionService";

export const INITIAL_LIVES = 2;

export type GameStatus = "idle" | "loading" | "playing" | "over";

export type GameState = {
  status: GameStatus;
  lives: number;
  score: number;
  // 다음에 풀 인덱스. queue[cursor]가 현재 문제. cursor === queue.length 면 모든 문제를 다 풀었다.
  cursor: number;
  queue: TriviaQuestion[];
};

export function createInitialState(): GameState {
  return { status: "idle", lives: INITIAL_LIVES, score: 0, cursor: 0, queue: [] };
}

export function startGame(queue: TriviaQuestion[]): GameState {
  return { status: "playing", lives: INITIAL_LIVES, score: 0, cursor: 0, queue };
}

export function currentQuestion(state: GameState): TriviaQuestion | null {
  return state.queue[state.cursor] ?? null;
}

// selectedIndex === null 은 타임아웃(오답 처리).
export function answerQuestion(state: GameState, selectedIndex: number | null): GameState {
  if (state.status !== "playing") return state;
  const q = currentQuestion(state);
  if (!q) return state;

  const isCorrect = selectedIndex !== null && selectedIndex === q.correctIndex;
  const lives = isCorrect ? state.lives : state.lives - 1;
  const score = isCorrect ? state.score + 1 : state.score;
  const cursor = state.cursor + 1;

  // 목숨 소진 → 게임 오버. 큐 끝까지 다 풀어도 게임 오버.
  if (lives <= 0 || cursor >= state.queue.length) {
    return { ...state, status: "over", lives: Math.max(0, lives), score, cursor };
  }
  return { ...state, status: "playing", lives, score, cursor };
}
