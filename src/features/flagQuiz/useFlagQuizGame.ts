import { useCallback, useEffect, useRef, useState } from "react";

import {
  answerQuestion,
  createInitialState,
  startGame,
  type GameState,
} from "./gameMachine";

export const QUESTION_SECONDS = 8;
const TICK_MS = 100;
const REVEAL_MS = 1000;

// 정답 공개 단계 정보. 1초간 정답/내 선택을 보여준 뒤 다음 문제로.
export type Reveal = {
  selected: string | null; // null = 타임아웃
  answer: string;
  correct: boolean;
};

export function useFlagQuizGame() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [reveal, setReveal] = useState<Reveal | null>(null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // select 안에서 최신 state를 읽기 위한 ref.
  const stateRef = useRef(state);
  stateRef.current = state;

  // handleSelect의 최신 참조를 유지하는 ref (startCountdown 내 forward reference 해결).
  const handleSelectRef = useRef<(c: string | null) => void>(() => {});

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
          // 타임아웃 → 오답 처리.
          handleSelectRef.current(null);
          return 0;
        }
        return next;
      });
    }, TICK_MS);
  }, []);

  // 선택(또는 타임아웃). reveal 1초 후 게임 머신을 전이시킨다.
  const handleSelect = useCallback(
    (code: string | null) => {
      const cur = stateRef.current;
      if (cur.status !== "playing" || !cur.current || reveal) return;
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      const answer = cur.current.answerCode;
      setReveal({ selected: code, answer, correct: code === answer });
      revealRef.current = setTimeout(() => {
        setReveal(null);
        const nextState = answerQuestion(cur, code);
        setState(nextState);
        if (nextState.status === "playing") startCountdown();
      }, REVEAL_MS);
    },
    [reveal, startCountdown],
  );

  // handleSelectRef를 항상 최신 handleSelect로 유지.
  handleSelectRef.current = handleSelect;

  const start = useCallback(() => {
    clearTimers();
    setReveal(null);
    setState(startGame());
    startCountdown();
  }, [clearTimers, startCountdown]);

  const restart = start;

  useEffect(() => clearTimers, [clearTimers]);

  return {
    status: state.status,
    lives: state.lives,
    score: state.score,
    current: state.current,
    secondsLeft,
    reveal,
    start,
    restart,
    select: handleSelect,
  };
}
