// Fisher-Yates 셔플. 원본을 변형하지 않고 새 배열을 반환한다.
// rng는 [0,1) 범위 함수 (테스트에서 결정적 주입을 위해 파라미터화).
export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
