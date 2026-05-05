// Map a visitCount to a discrete heatmap color.
const PALETTE = [
  "#243b55", // 0 — base land color (un-visited)
  "#3aa66b", // 1
  "#4ec97a", // 2
  "#7cf08e", // 3
  "#bdf99b", // 4+
];

export function colorForVisitCount(count: number): string {
  if (!count || count <= 0) return PALETTE[0];
  if (count >= 4) return PALETTE[4];
  return PALETTE[count];
}

export const BG_COLOR = "#0b1220";
