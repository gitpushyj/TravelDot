import { useCallback, useEffect, useRef, useState } from "react";

import {
  answerQuestion,
  createInitialState,
  currentQuestion,
  startGame,
  type GameState,
} from "./gameMachine";
import { fetchTriviaQuestions } from "./questionService";

// 텍스트 문제라 국기보다 읽는 시간이 오래 걸린다. 15초로 둔다.
export const QUESTION_SECONDS = 15;
const TICK_MS = 100;
const REVEAL_MS = 1200;
// 한 게임당 문제 풀 크기. 100문제 모두 가져오면 큐가 너무 길어 게임이 끝나지 않으니 30개로 제한.
const GAME_QUESTION_COUNT = 30;

// 정답 공개 단계 정보. 1.2초간 정답/내 선택을 보여준 뒤 다음 문제로 이동한다.
export type Reveal = {
  selected: number | null; // null = 타임아웃
  answer: number;
  correct: boolean;
};

export function useTravelTriviaGame() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [loadError, setLoadError] = useState(false);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const handleSelectRef = useRef<(c: number | null) => void>(() => {});

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (revealRef.current) clearTimeout(revealRef.current);
    tickRef.current = null;
    revealRef.current = null;
  }, []);

  const startCountdown = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    setSecondsLeft(QUESTION_SECONDS);
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        const next = Math.round((s - TICK_MS / 1000) * 10) / 10;
        if (next <= 0) {
          if (tickRef.current) clearInterval(tickRef.current);
          tickRef.current = null;
          handleSelectRef.current(null);
          return 0;
        }
        return next;
      });
    }, TICK_MS);
  }, []);

  const handleSelect = useCallback(
    (index: number | null) => {
      const cur = stateRef.current;
      if (cur.status !== "playing" || reveal) return;
      const q = currentQuestion(cur);
      if (!q) return;
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      const answer = q.correctIndex;
      setReveal({ selected: index, answer, correct: index === answer });
      revealRef.current = setTimeout(() => {
        setReveal(null);
        const next = answerQuestion(cur, index);
        setState(next);
        if (next.status === "playing") startCountdown();
      }, REVEAL_MS);
    },
    [reveal, startCountdown],
  );

  handleSelectRef.current = handleSelect;

  const start = useCallback(async () => {
    clearTimers();
    setReveal(null);
    setLoadError(false);
    setState((s) => ({ ...s, status: "loading" }));
    const questions = await fetchTriviaQuestions(GAME_QUESTION_COUNT);
    if (questions.length === 0) {
      setLoadError(true);
      setState(createInitialState());
      return;
    }
    setState(startGame(questions));
    startCountdown();
  }, [clearTimers, startCountdown]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    status: state.status,
    lives: state.lives,
    score: state.score,
    cursor: state.cursor,
    total: state.queue.length,
    current: currentQuestion(state),
    secondsLeft,
    reveal,
    loadError,
    start,
    restart: start,
    select: handleSelect,
  };
}
