import dotData from "../../../../assets/data/dots.json";

// 실제 dot 지도 좌표(assets/data/dots.json)를 저해상도 grid로 비닝해
// "월드맵 실루엣"을 만든다. 안내 페이지의 미니 지도 데모(MiniDotMap)에서
// 단색/팔레트로 칠해 보여준다.

export const GRID_COLS = 32;
export const GRID_ROWS = 14;

// dots.json 메타와 동일한 위/경도 범위.
const MIN_LAT = -60;
const MAX_LAT = 85;

// 색칠할 영역(ISO2 country code) — 한 셀에 visited country 도트가 하나라도
// 들어 있으면 그 셀은 visited로 표기되어 팔레트 색으로 칠해진다. 직사각형
// 박스가 아닌 실제 국가 경계 기준이라 가장자리가 인위적으로 보이지 않는다.
const VISITED_COUNTRIES = new Set<string>([
  // 유럽 (러시아·터키는 시각적 부담을 줄이려 제외)
  "GB", "IE", "FR", "DE", "NL", "BE", "LU", "CH", "AT", "IT", "ES", "PT",
  "DK", "SE", "NO", "FI", "IS", "PL", "CZ", "SK", "HU", "RO", "BG", "GR",
  "HR", "SI", "RS", "BA", "ME", "MK", "AL", "EE", "LV", "LT", "BY", "UA",
  "MD", "CY", "MT", "AD", "MC", "SM", "VA", "LI", "XK",
  // 미국
  "US",
  // 호주
  "AU",
  // 북아프리카 — 이집트
  "EG",
  // 남아프리카
  "ZA",
]);

export type LandCell = {
  row: number;
  col: number;
  level: 1 | 2 | 3 | 4;
  // 데모용 "사용자가 방문한 셀" 플래그. visited country 도트가 비닝된 셀만 true.
  visited: boolean;
};

type Dot = { lat: number; lng: number; country?: string };

function cellOf(d: Dot): { row: number; col: number } {
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
  return { row, col };
}

function buildLandCells(): LandCell[] {
  const dots = (dotData as { dots: Dot[] }).dots;
  const land = new Set<string>();
  const visited = new Set<string>();
  for (const d of dots) {
    const { row, col } = cellOf(d);
    const key = `${row},${col}`;
    land.add(key);
    if (d.country && VISITED_COUNTRIES.has(d.country)) {
      visited.add(key);
    }
  }
  return [...land].map((key) => {
    const [row, col] = key.split(",").map(Number);
    // 셀마다 고정된 1~4 레벨 — 팔레트 모드에서 heatmap gradient를 흉내낸다.
    const level = (((row * 31 + col * 17) % 4) + 1) as 1 | 2 | 3 | 4;
    return { row, col, level, visited: visited.has(key) };
  });
}

export const LAND_CELLS: readonly LandCell[] = buildLandCells();
