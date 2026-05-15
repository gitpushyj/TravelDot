import { shuffle } from "./shuffle";

// 결정적 rng: 주어진 시퀀스를 순환하며 반환한다.
function seqRng(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("shuffle", () => {
  it("원본 배열을 변형하지 않고 새 배열을 반환한다", () => {
    const input = [1, 2, 3, 4];
    const out = shuffle(input, seqRng([0, 0, 0]));
    expect(out).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4]);
  });

  it("같은 원소 집합을 유지한다", () => {
    const out = shuffle(["a", "b", "c", "d"], seqRng([0.5, 0.1, 0.9]));
    expect([...out].sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("rng=0이면 Fisher-Yates에서 첫 원소가 끝으로 회전한다", () => {
    // j = floor(rng * (i+1)) = 0 매번 → 각 i에서 arr[i]와 arr[0] 교환
    const out = shuffle([1, 2, 3], () => 0);
    expect(out).toEqual([2, 3, 1]);
  });
});
