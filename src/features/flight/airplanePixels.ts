// 비행기 픽셀 정의. 위에서 내려다본 여객기 실루엣.
// 그리드는 13열 × 14행. 사용자 이미지(검은 outline + 흰 body + 파란 액센트: 조종석,
// 날개 줄, 창문)의 핵심 요소를 도트지도 위에서도 식별 가능한 크기에 압축한 형태.
// 회전 기준점은 (PIVOT_COL, PIVOT_ROW)로 잡아 주날개 본체 가운데를 통과한다.
//
// 코는 row 0(위쪽), 꼬리 끝은 row 12. row 13은 빨간 anti-collision 점등 전용.
// 비행기의 "전진 방향"은 -Y(위쪽). 회전 각도는 정북 = 0°, 시계방향 +.

export const AIRPLANE_COLS = 13;
export const AIRPLANE_ROWS = 14;

// 회전 기준점: 동체 중앙선(col 6) × 주날개 본체 가운데(row 6).
export const AIRPLANE_PIVOT_COL = 6;
export const AIRPLANE_PIVOT_ROW = 6;

// 꼬리 끝 빨간 anti-collision 점등 위치. 일반 픽셀에는 포함하지 않고 FlightOverlay에서
// 별도 layer + opacity 깜빡임으로 그린다.
export const AIRPLANE_RED_LIGHT: { col: number; row: number } = { col: 6, row: 13 };

// row × col 그리드.
// 0 = 빈칸, 1 = 흰 body, 2 = 파란 액센트(조종석/날개 줄/창문).
// 검은 outline은 FlightOverlay에서 모든 픽셀의 가장자리를 살짝 큰 어두운 사각형으로
// 그려 자동 표현된다(별도 outline 좌표 불필요).
const RAW: number[][] = [
  [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0], // row 0 — 코 (둥근 노즈)
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], // row 1 — 동체
  [0, 0, 0, 0, 1, 2, 2, 2, 1, 0, 0, 0, 0], // row 2 — 조종석 (파랑 액센트)
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], // row 3 — 동체
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // row 4 — 날개 시작
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 5 — 주날개 전폭
  [1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1], // row 6 — 날개 파란 줄
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // row 7 — 날개 후미
  [0, 0, 0, 0, 1, 1, 2, 1, 1, 0, 0, 0, 0], // row 8 — 동체 + 창문(파랑)
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], // row 9 — 동체
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // row 10 — 수평 꼬리
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0], // row 11
  [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0], // row 12 — 수직 꼬리 끝
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // row 13 — 빨간 등 자리
];

export type AirplanePixel = { col: number; row: number };

// 미리 계산해 두는 픽셀 좌표 리스트. FlightOverlay에서 매 프레임 반복하지 않도록.
function collectPixels(target: 1 | 2): AirplanePixel[] {
  const out: AirplanePixel[] = [];
  for (let r = 0; r < RAW.length; r++) {
    const row = RAW[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c] === target) out.push({ col: c, row: r });
    }
  }
  return out;
}

// 흰 body 픽셀.
export const AIRPLANE_PIXELS_BODY: AirplanePixel[] = collectPixels(1);
// 파란 액센트 픽셀 (조종석 / 날개 줄 / 창문).
export const AIRPLANE_PIXELS_ACCENT: AirplanePixel[] = collectPixels(2);
// 모든 픽셀 — 검은 outline을 그릴 때 사용.
export const AIRPLANE_PIXELS: AirplanePixel[] = [
  ...AIRPLANE_PIXELS_BODY,
  ...AIRPLANE_PIXELS_ACCENT,
];
