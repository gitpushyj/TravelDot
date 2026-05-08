import type { YearMode } from "../../navigation/types";

// 공유 카드의 연도 라벨 문자열을 만든다.
// - year 모드: "YYYY"
// - all 모드:
//   - 사용 가능한 연도가 없으면 "" (라벨 미표시)
//   - 1년만 있으면 "YYYY"
//   - 여러 해면 "YYYY ~ YYYY" (min~max)
export function formatShareYearLabel(
  yearMode: YearMode,
  availableYears: number[]
): string {
  if (yearMode.kind === "year") return String(yearMode.year);
  if (availableYears.length === 0) return "";
  let min = availableYears[0];
  let max = availableYears[0];
  for (const y of availableYears) {
    if (y < min) min = y;
    if (y > max) max = y;
  }
  if (min === max) return String(min);
  return `${min} ~ ${max}`;
}
