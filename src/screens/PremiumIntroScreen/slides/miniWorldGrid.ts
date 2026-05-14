import dotData from "../../../../assets/data/dots.json";

// 실제 dot 지도 좌표(assets/data/dots.json)를 저해상도 grid로 비닝해
// "월드맵 실루엣"을 만든다. 안내 페이지의 미니 지도 데모(MiniDotMap)에서
// 단색/팔레트로 칠해 보여준다.

export const GRID_COLS = 32;
export const GRID_ROWS = 14;

// dots.json 메타와 동일한 위/경도 범위.
const MIN_LAT = -60;
const MAX_LAT = 85;

export type LandCell = { row: number; col: number; level: 1 | 2 | 3 | 4 };

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
    return { row, col, level };
  });
}

export const LAND_CELLS: readonly LandCell[] = buildLandCells();
