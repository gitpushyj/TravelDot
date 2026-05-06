// 방문 일수를 잔디색 5단계로 매핑한다. 본국은 일수와 무관하게 파란색.
const PALETTE = [
  "#243b55", // 0일 — 미방문
  "#3aa66b", // 1~2일
  "#4ec97a", // 3~6일
  "#7cf08e", // 7~13일
  "#bdf99b", // 14일+
];

export const HOME_COLOR = "#2f6fed";
export const BG_COLOR = "#0b1220";

export function colorForVisit(opts: {
  count: number;
  isHomeCountry: boolean;
}): string {
  if (opts.isHomeCountry) return HOME_COLOR;
  const c = opts.count | 0;
  if (c <= 0) return PALETTE[0];
  if (c <= 2) return PALETTE[1];
  if (c <= 6) return PALETTE[2];
  if (c <= 13) return PALETTE[3];
  return PALETTE[4];
}
