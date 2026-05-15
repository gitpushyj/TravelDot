import { createInitialState, startGame, answerQuestion, INITIAL_LIVES } from "./gameMachine";

function seqRng(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("gameMachine", () => {
  it("초기 상태는 idle, 목숨 가득, 점수 0", () => {
    const s = createInitialState();
    expect(s.status).toBe("idle");
    expect(s.lives).toBe(INITIAL_LIVES);
    expect(s.score).toBe(0);
    expect(s.current).toBeNull();
  });

  it("startGame은 playing 상태와 첫 문제를 만든다", () => {
    const s = startGame(seqRng([0.1, 0.2, 0.3, 0.4]));
    expect(s.status).toBe("playing");
    expect(s.current).not.toBeNull();
    expect(s.answeredCount).toBe(0);
  });

  it("정답이면 점수가 오르고 목숨은 유지, 다음 문제로 진행", () => {
    const s0 = startGame(seqRng([0.1, 0.2, 0.3, 0.4]));
    const s1 = answerQuestion(s0, s0.current!.answerCode, seqRng([0.5, 0.6, 0.7, 0.8]));
    expect(s1.score).toBe(1);
    expect(s1.lives).toBe(INITIAL_LIVES);
    expect(s1.answeredCount).toBe(1);
    expect(s1.status).toBe("playing");
    expect(s1.current).not.toBeNull();
  });

  it("오답이면 목숨이 줄고 점수는 유지", () => {
    const s0 = startGame(seqRng([0.1, 0.2, 0.3, 0.4]));
    const wrong = s0.current!.choices.find((c) => c !== s0.current!.answerCode)!;
    const s1 = answerQuestion(s0, wrong, seqRng([0.5, 0.6, 0.7, 0.8]));
    expect(s1.score).toBe(0);
    expect(s1.lives).toBe(INITIAL_LIVES - 1);
  });

  it("선택지 null(타임아웃)은 오답으로 처리한다", () => {
    const s0 = startGame(seqRng([0.1, 0.2, 0.3, 0.4]));
    const s1 = answerQuestion(s0, null, seqRng([0.5, 0.6, 0.7, 0.8]));
    expect(s1.lives).toBe(INITIAL_LIVES - 1);
  });

  it("목숨이 0이 되면 status는 over, current는 마지막 문제 유지", () => {
    let s = startGame(seqRng([0.1, 0.2, 0.3, 0.4]));
    for (let i = 0; i < INITIAL_LIVES; i++) {
      const wrong = s.current!.choices.find((c) => c !== s.current!.answerCode)!;
      s = answerQuestion(s, wrong, seqRng([0.5, 0.6, 0.7, 0.8]));
    }
    expect(s.status).toBe("over");
    expect(s.current).not.toBeNull();
  });

  it("같은 게임 안에서 정답 코드는 usedCodes에 누적된다", () => {
    const s0 = startGame(seqRng([0.1, 0.2, 0.3, 0.4]));
    const first = s0.current!.answerCode;
    const s1 = answerQuestion(s0, first, seqRng([0.5, 0.6, 0.7, 0.8]));
    expect(s1.usedCodes).toContain(first);
  });
});
