// 비행기 픽셀 정의. 위에서 내려다본 여객기 실루엣.
// 그리드는 11열 × 10행. 각 셀은 0(빈칸) 또는 1(픽셀).
// (col, row) 좌표는 중심을 (PIVOT_COL, PIVOT_ROW)로 잡아 회전 기준점이 동체 중앙을 통과한다.
//
// 코는 row 0(위쪽), 꼬리는 row 9(아래쪽). 비행기의 "전진 방향"은 +Y가 아니라 -Y(위쪽).
// 회전 각도는 정북 = 0°, 시계방향 +. 회전을 그대로 SVG/Skia rotate에 넣으면 코가 회전 후
// 진행 방향을 향한다.

export const AIRPLANE_COLS = 11;
export const AIRPLANE_ROWS = 10;

// 회전 기준점: 동체 중앙선(col 5) × 주날개 윗줄(row 3)
// 비행기 한가운데 살짝 앞쪽으로 잡아야 회전 시 시각적 무게중심이 자연스럽다.
export const AIRPLANE_PIVOT_COL = 5;
export const AIRPLANE_PIVOT_ROW = 3;

// row × col 그리드. 1=픽셀, 0=빈칸.
// 디자인 스펙(2026-05-11-flight-mode-design.md §3.1)과 동일.
const RAW: number[][] = [
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], // row 0 — 코
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0], // 동체 앞
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 주날개 (전폭)
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0], // 동체 뒤
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0], // 수평 꼬리날개
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0], // row 9 — 꼬리
];

export type AirplanePixel = { col: number; row: number };

// 미리 계산해 두는 픽셀 좌표 리스트. FlightOverlay에서 매 프레임 반복하지 않도록.
export const AIRPLANE_PIXELS: AirplanePixel[] = (() => {
  const out: AirplanePixel[] = [];
  for (let r = 0; r < RAW.length; r++) {
    const row = RAW[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c] === 1) out.push({ col: c, row: r });
    }
  }
  return out;
})();
