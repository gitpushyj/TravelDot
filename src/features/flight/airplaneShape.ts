// 비행기 벡터 실루엣. 위에서 내려다본 여객기 형태를 Skia Path로 그린다.
//
// 좌표계는 10×10 단위 공간 — FlightOverlay가 planePx(단위 한 칸의 화면 px)를 곱해
// 실제 크기로 렌더한다. 회전·wobble·빨간 비콘 좌표가 모두 이 좌표계에 의존하므로
// 단위 공간과 pivot(4.5, 4.5)은 이전 픽셀 버전과 동일하게 유지한다.
//
// 비행기의 "전진 방향"은 -Y(위쪽). 회전 각도는 정북 = 0°, 시계방향 +.
// 실루엣은 중심축 col 4.5(= pivot col) 기준 좌우 대칭이라 회전 시 흔들림이 없다.

import { Skia, type SkPath } from "@shopify/react-native-skia";

// 회전 기준점: 좌우 대칭축 col 4.5, 세로 중앙 row 4.5.
const PIVOT = 4.5;
export const AIRPLANE_PIVOT_COL = PIVOT;
export const AIRPLANE_PIVOT_ROW = PIVOT;

// 디자인 좌표를 pivot 기준으로 이만큼 키워 10×10 단위 공간을 꽉 채운다.
// (이전 픽셀 비행기와 화면상 크기를 맞추기 위한 값 — 날개폭이 거의 10단위가 된다.)
const SILHOUETTE_SCALE = 1.1;

// 디자인 좌표: 기수 0.25, 꼬리 8.75. 아래 sx/sy로 스케일해 실제 단위 좌표가 된다.
const NOSE_Y = 0.25;
const TAIL_Y = 8.75;

// 디자인 좌표 → 단위 좌표. pivot(4.5)을 중심으로 SILHOUETTE_SCALE배 확대.
// sx: 중심축으로부터의 거리 dx → col, sy: 세로 → row.
const sx = (dx: number) => PIVOT + dx * SILHOUETTE_SCALE;
const sy = (vy: number) => PIVOT + (vy - PIVOT) * SILHOUETTE_SCALE;

// 꼬리 끝 빨간 anti-collision 점등 위치(그리드 좌표). FlightOverlay의 RedBeacon이
// 이 좌표에서 planePx 크기의 사각형을 그린다 — col 4.0은 사각형이 중심축(4.5)에
// 걸치게 하고, row는 스케일된 꼬리 끝(sy(TAIL_Y))에 사각형 중심이 오도록 0.5 뺀 값.
export const AIRPLANE_RED_LIGHT: { col: number; row: number } = {
  col: 4.0,
  row: sy(TAIL_Y) - 0.5,
};

// 오른쪽 절반 외곽선 — 기수에서 꼬리까지 순서대로.
// 좌표는 (중심축으로부터의 거리 dx, 세로 y). dx > 0 = 오른쪽.
type Seg =
  | { k: "L"; x: number; y: number }
  | { k: "Q"; cx: number; cy: number; x: number; y: number }
  | {
      k: "C";
      c1x: number;
      c1y: number;
      c2x: number;
      c2y: number;
      x: number;
      y: number;
    };

const RIGHT_OUTLINE: Seg[] = [
  // 둥근 기수 → 동체 어깨
  { k: "C", c1x: 0.34, c1y: 0.3, c2x: 0.7, c2y: 0.85, x: 0.7, y: 1.85 },
  // 동체 → 주날개 앞전 뿌리 (살짝 불룩)
  { k: "Q", cx: 0.74, cy: 2.4, x: 0.66, y: 3.0 },
  // 주날개 앞전 — 뒤로 젖혀진 직선
  { k: "L", x: 4.55, y: 5.95 },
  // 날개 끝
  { k: "Q", cx: 4.66, cy: 6.1, x: 4.35, y: 6.35 },
  // 주날개 뒷전 — 직선
  { k: "L", x: 0.58, y: 4.85 },
  // 동체 → 수평꼬리 앞전 뿌리 (가늘어짐)
  { k: "Q", cx: 0.52, cy: 6.2, x: 0.3, y: 7.3 },
  // 수평꼬리 앞전
  { k: "L", x: 1.95, y: 8.2 },
  // 꼬리날개 끝
  { k: "Q", cx: 2.05, cy: 8.34, x: 1.85, y: 8.48 },
  // 수평꼬리 뒷전
  { k: "L", x: 0.26, y: 7.92 },
  // 꼬리 콘 → 꼬리 끝
  { k: "Q", cx: 0.16, cy: 8.55, x: 0.0, y: 8.75 },
];

export type AirplanePaths = {
  body: SkPath;
  cockpit: SkPath;
  engines: SkPath;
};

// planePx(단위 한 칸의 화면 px)를 받아 실제 크기의 Path 3종을 만든다.
// FlightOverlay에서 planePx가 바뀔 때만 useMemo로 다시 호출한다.
export function buildAirplane(u: number): AirplanePaths {
  const x = (dx: number) => sx(dx) * u;
  const y = (vy: number) => sy(vy) * u;

  // ---- 동체 + 날개 실루엣 (닫힌 단일 외곽선) ----
  const body = Skia.Path.Make();
  body.moveTo(x(0), y(NOSE_Y));

  // 오른쪽 절반: 기수 → 꼬리.
  for (const s of RIGHT_OUTLINE) {
    if (s.k === "L") body.lineTo(x(s.x), y(s.y));
    else if (s.k === "Q") body.quadTo(x(s.cx), y(s.cy), x(s.x), y(s.y));
    else body.cubicTo(x(s.c1x), y(s.c1y), x(s.c2x), y(s.c2y), x(s.x), y(s.y));
  }

  // 왼쪽 절반: 오른쪽 세그먼트를 역순·좌우 반전으로 되짚어 꼬리 → 기수.
  // 각 세그먼트의 시작점(= 이전 세그먼트의 끝점)을 미리 모아 둔다.
  const starts: { x: number; y: number }[] = [];
  let px = 0;
  let py = NOSE_Y;
  for (const s of RIGHT_OUTLINE) {
    starts.push({ x: px, y: py });
    px = s.x;
    py = s.y;
  }
  for (let i = RIGHT_OUTLINE.length - 1; i >= 0; i--) {
    const s = RIGHT_OUTLINE[i];
    const from = starts[i];
    if (s.k === "L") {
      body.lineTo(x(-from.x), y(from.y));
    } else if (s.k === "Q") {
      body.quadTo(x(-s.cx), y(s.cy), x(-from.x), y(from.y));
    } else {
      // cubic 역순: 두 제어점의 순서도 뒤바뀐다.
      body.cubicTo(
        x(-s.c2x),
        y(s.c2y),
        x(-s.c1x),
        y(s.c1y),
        x(-from.x),
        y(from.y)
      );
    }
  }
  body.close();

  // ---- 조종석 윈드실드 (파란 액센트) ----
  const cockpit = Skia.Path.Make();
  cockpit.moveTo(x(0), y(0.78));
  cockpit.quadTo(x(0.46), y(1.2), x(0.4), y(1.78));
  cockpit.quadTo(x(0), y(1.92), x(-0.4), y(1.78));
  cockpit.quadTo(x(-0.46), y(1.2), x(0), y(0.78));
  cockpit.close();

  // ---- 양 날개 엔진 포드 (어두운 액센트) ----
  // 비행 방향(세로)으로 길쭉한 캡슐. 양 끝을 quad 두 개로 둥글린다.
  const engines = Skia.Path.Make();
  const addEngine = (dx: number) => {
    const hw = 0.19; // 가로 반폭
    const hl = 0.32; // 세로 직선부 반길이
    const ecy = 4.78; // 엔진 중심 y (주날개 위)
    const top = ecy - hl;
    const bot = ecy + hl;
    engines.moveTo(x(dx - hw), y(top));
    engines.lineTo(x(dx - hw), y(bot));
    engines.quadTo(x(dx - hw), y(bot + hw), x(dx), y(bot + hw));
    engines.quadTo(x(dx + hw), y(bot + hw), x(dx + hw), y(bot));
    engines.lineTo(x(dx + hw), y(top));
    engines.quadTo(x(dx + hw), y(top - hw), x(dx), y(top - hw));
    engines.quadTo(x(dx - hw), y(top - hw), x(dx - hw), y(top));
    engines.close();
  };
  addEngine(2.2);
  addEngine(-2.2);

  return { body, cockpit, engines };
}
