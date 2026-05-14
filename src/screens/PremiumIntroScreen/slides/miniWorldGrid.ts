import dotData from "../../../../assets/data/dots.json";

// 실제 dot 지도 좌표(assets/data/dots.json)를 저해상도 grid로 비닝해
// "월드맵 실루엣"을 만든다. 안내 페이지의 미니 지도 데모(MiniDotMap)에서
// 단색/팔레트로 칠해 보여준다.

export const GRID_COLS = 32;
export const GRID_ROWS = 14;

// dots.json 메타와 동일한 위/경도 범위.
const MIN_LAT = -60;
const MAX_LAT = 85;

export type LandCell = {
  row: number;
  col: number;
  level: 1 | 2 | 3 | 4;
  // 데모용 "사용자가 방문한 셀" 플래그. 실제 여행 패턴처럼 보이도록
  // 일부 지역(유럽 전역, 동남/동아시아 일부, 미 동부 일부, 남미 일부 등)만 true.
  visited: boolean;
};

// (row, col)이 데모 방문 지역(유럽·동아시아·미국·브라질·동남아 일부)에 속하는지.
// 32×14 equirectangular grid 기준 — 대륙이 보이는 칸을 손으로 지정한다.
function isVisitedRegion(row: number, col: number): boolean {
  // 유럽 (전역)
  if (col >= 15 && col <= 19 && row >= 2 && row <= 5) return true;
  // 동아시아 (한국·일본·중국 동부)
  if (col >= 24 && col <= 27 && row >= 3 && row <= 5) return true;
  // 동남아시아 (베트남·태국·필리핀 일대)
  if (col >= 23 && col <= 26 && row >= 6 && row <= 7) return true;
  // 미국 동부
  if (col >= 8 && col <= 11 && row >= 3 && row <= 4) return true;
  // 남미 동부 (브라질)
  if (col >= 10 && col <= 12 && row >= 8 && row <= 9) return true;
  return false;
}

function buildLandCells(): LandCell[] {
  const seen = new Set<string>();
  const dots = (dotData as { dots: { lat: number; lng: number }[] }).dots;
  for (const d of dots) {
    const col = Math.min(
      GRID_COLS - 1,
      Math.max(0, Math.floor(((d.lng + 180) / 360) * GRID_COLS))
    );
    const row = Math.min(
      GRID_ROWS - 1,
      Math.max(
        0,
        Math.floor(((MAX_LAT - d.lat) / (MAX_LAT - MIN_LAT)) * GRID_ROWS)
      )
    );
    seen.add(`${row},${col}`);
  }
  return [...seen].map((key) => {
    const [row, col] = key.split(",").map(Number);
    // 셀마다 고정된 1~4 레벨 — 팔레트 모드에서 heatmap gradient를 흉내낸다.
    const level = (((row * 31 + col * 17) % 4) + 1) as 1 | 2 | 3 | 4;
    const visited = isVisitedRegion(row, col);
    return { row, col, level, visited };
  });
}

export const LAND_CELLS: readonly LandCell[] = buildLandCells();
