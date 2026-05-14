import React, { useMemo } from "react";
import { View } from "react-native";

import type { MapPalette } from "../../../theme/mapPalettes";
import { GRID_COLS, GRID_ROWS, LAND_CELLS } from "./miniWorldGrid";

type Props = {
  /** 그려질 전체 가로 폭(px). 셀 크기는 여기서 자동 계산된다. */
  width: number;
  /** 단색 모드 — 모든 land 셀을 이 색으로 (기기 동기화 데모). */
  soloColor?: string;
  /** 팔레트 모드 — land 셀을 레벨별 색으로 칠한다 (지도 스타일 데모). */
  palette?: MapPalette;
  /** 팔레트 모드에서 light/dark 중 어느 shade를 쓸지. */
  mode?: "light" | "dark";
};

// 실제 dot 좌표를 비닝한 월드맵 실루엣을 작은 점들로 그린다.
// land 셀만 절대 위치로 렌더해 노드 수를 줄인다.
export default function MiniDotMap({ width, soloColor, palette, mode = "light" }: Props) {
  const gap = Math.max(1, width / GRID_COLS / 4);
  const cell = (width - gap * (GRID_COLS - 1)) / GRID_COLS;
  const height = cell * GRID_ROWS + gap * (GRID_ROWS - 1);

  const colorFor = useMemo(() => {
    if (palette) {
      const shades = mode === "dark" ? palette.dark : palette.light;
      // shades[0]은 "방문 없음" 톤이라 1~4만 쓴다.
      return (level: 1 | 2 | 3 | 4) => shades[level];
    }
    return (_level: 1 | 2 | 3 | 4) => soloColor ?? "#000";
  }, [palette, mode, soloColor]);

  return (
    <View style={{ width, height }}>
      {LAND_CELLS.map(({ row, col, level }) => (
        <View
          key={`${row},${col}`}
          style={{
            position: "absolute",
            left: col * (cell + gap),
            top: row * (cell + gap),
            width: cell,
            height: cell,
            borderRadius: cell * 0.28,
            backgroundColor: colorFor(level),
          }}
        />
      ))}
    </View>
  );
}
