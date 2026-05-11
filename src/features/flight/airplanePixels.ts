// 비행기 픽셀 정의. 위에서 내려다본 단순 카툰풍 실루엣.
// 10×10 그리드. 둥근 코 + 풀폭 주날개 + 가는 꼬리. 액센트는 조종석 2픽셀만.
// 회전 기준점은 그리드 정중앙 (4.5, 4.5)로 잡아 좌우 대칭 회전을 보장한다.
//
// 코는 row 0(위쪽), 꼬리 끝은 row 9. 빨간 anti-collision 점등은 그리드 바깥 row 10에
// 별도로 그린다(FlightOverlay 참조).
// 비행기의 "전진 방향"은 -Y(위쪽). 회전 각도는 정북 = 0°, 시계방향 +.

export const AIRPLANE_COLS = 10;
export const AIRPLANE_ROWS = 10;

// 회전 기준점: 그리드 정중앙. 동체와 주날개 모두 좌우대칭이므로 회전 흔들림 없음.
export const AIRPLANE_PIVOT_COL = 4.5;
export const AIRPLANE_PIVOT_ROW = 4.5;

// 꼬리 끝 빨간 anti-collision 점등 위치. 일반 픽셀에는 포함하지 않고 FlightOverlay에서
// 별도 layer + opacity 깜빡임으로 그린다. 꼬리(row 9) 바로 아래 그리드 밖에 둔다.
export const AIRPLANE_RED_LIGHT: { col: number; row: number } = { col: 4.5, row: 10 };

// row × col 그리드.
// 0 = 빈칸, 1 = 흰 body, 2 = 파란 액센트(조종석).
// 검은 outline은 FlightOverlay에서 모든 픽셀의 가장자리를 살짝 큰 어두운 사각형으로
// 그려 자동 표현된다(별도 outline 좌표 불필요).
const RAW: number[][] = [
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0], // row 0 — 코 (둥근)
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0], // row 1 — 머리 옆
  [0, 0, 1, 1, 2, 2, 1, 1, 0, 0], // row 2 — 조종석 (파란 액센트)
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0], // row 3 — 동체
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 4 — 주날개 풀폭 ①
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 5 — 주날개 풀폭 ②
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0], // row 6 — 동체
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0], // row 7 — 동체
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0], // row 8 — 수평 꼬리
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0], // row 9 — 수직 꼬리 끝
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
// 파란 액센트 픽셀 (조종석).
export const AIRPLANE_PIXELS_ACCENT: AirplanePixel[] = collectPixels(2);
// 모든 픽셀 — 검은 outline을 그릴 때 사용.
export const AIRPLANE_PIXELS: AirplanePixel[] = [
  ...AIRPLANE_PIXELS_BODY,
  ...AIRPLANE_PIXELS_ACCENT,
];
