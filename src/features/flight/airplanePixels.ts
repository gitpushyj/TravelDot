// 비행기 픽셀 정의. 위에서 내려다본 여객기 실루엣.
// 그리드는 13열 × 13행 — 코 점진적 노즈 + 주날개 살짝 후퇴익 + 수직/수평 꼬리 분리.
// 회전 기준점은 (PIVOT_COL, PIVOT_ROW)로 잡아 주날개 본체 가운데를 통과한다.
//
// 코는 row 0(위쪽), 꼬리 끝은 row 12. 비행기의 "전진 방향"은 -Y(위쪽).
// 회전 각도는 정북 = 0°, 시계방향 +. 회전을 그대로 Skia rotate에 넣으면 코가 회전 후
// 진행 방향을 향한다.

export const AIRPLANE_COLS = 13;
export const AIRPLANE_ROWS = 13;

// 회전 기준점: 동체 중앙선(col 6) × 주날개 본체(row 5)
export const AIRPLANE_PIVOT_COL = 6;
export const AIRPLANE_PIVOT_ROW = 5;

// 꼬리 끝의 빨간 anti-collision 점등 위치 (col, row). 일반 픽셀에는 포함하지 않고
// FlightOverlay에서 별도 layer + opacity 깜빡임으로 그린다.
export const AIRPLANE_RED_LIGHT: { col: number; row: number } = { col: 6, row: 12 };

// row × col 그리드. 1=픽셀, 0=빈칸.
// 형태: 코 1→3→5→7로 점진 노즈, 주날개 row 4 전폭 + row 5 살짝 후퇴익,
// 동체는 좁고 길게, 꼬리는 수평(row 9)과 수직(row 10-11) 분리. row 12는 빨간 등 전용.
const RAW: number[][] = [
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], // row 0 — 코 끝
  [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0], // row 1
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], // row 2 — 노즈 콘
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // row 3
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 4 — 주날개 전폭
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // row 5 — 주날개 본체(살짝 후퇴)
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], // row 6 — 동체 전이
  [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0], // row 7 — 동체
  [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0], // row 8 — 동체
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // row 9 — 수평 꼬리
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], // row 10
  [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0], // row 11 — 수직 꼬리 끝
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // row 12 — (빨간 등 자리, 일반 픽셀에는 없음)
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
