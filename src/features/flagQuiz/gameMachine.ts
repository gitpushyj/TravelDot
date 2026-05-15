import { generateQuestion, type QuizQuestion } from "./quizGenerator";

export const INITIAL_LIVES = 2;

export type GameStatus = "idle" | "playing" | "over";

export type GameState = {
  status: GameStatus;
  lives: number;
  score: number;
  // 지금까지 답한 문제 수.
  answeredCount: number;
  // 이번 게임에서 정답으로 출제된 코드들 (비복원 추출용).
  usedCodes: string[];
  // 현재(또는 게임오버 시 마지막) 문제.
  current: QuizQuestion | null;
};

export function createInitialState(): GameState {
  return {
    status: "idle",
    lives: INITIAL_LIVES,
    score: 0,
    answeredCount: 0,
    usedCodes: [],
    current: null,
  };
}

export function startGame(rng: () => number = Math.random): GameState {
  return {
    status: "playing",
    lives: INITIAL_LIVES,
    score: 0,
    answeredCount: 0,
    usedCodes: [],
    current: generateQuestion(0, new Set(), rng),
  };
}

// selectedCode === null 은 타임아웃(오답 처리).
export function answerQuestion(
  state: GameState,
  selectedCode: string | null,
  rng: () => number = Math.random,
): GameState {
  if (state.status !== "playing" || !state.current) return state;

  const isCorrect = selectedCode === state.current.answerCode;
  const lives = isCorrect ? state.lives : state.lives - 1;
  const score = isCorrect ? state.score + 1 : state.score;
  const answeredCount = state.answeredCount + 1;
  const usedCodes = [...state.usedCodes, state.current.answerCode];

  if (lives <= 0) {
    return { ...state, status: "over", lives: 0, score, answeredCount, usedCodes };
  }
  return {
    status: "playing",
    lives,
    score,
    answeredCount,
    usedCodes,
    current: generateQuestion(answeredCount, new Set(usedCodes), rng),
  };
}
