import { addOneDay, diffInDays } from "./dateUtils";

export type DayKey = { countryCode: string; date: string };

// 같은 국가에서 인접 visit_days 사이 gap이 2~thresholdDays이면
// 사이의 빈 날짜들을 채워야 할 후보로 반환한다.
// 입력은 정렬되어 있지 않아도 되며, 이 함수가 정렬한다.
export function computeBridgeFills(
  days: DayKey[],
  thresholdDays: number
): DayKey[] {
  const sorted = [...days].sort((a, b) => {
    if (a.countryCode !== b.countryCode) {
      return a.countryCode < b.countryCode ? -1 : 1;
    }
    return a.date < b.date ? -1 : 1;
  });
  const fills: DayKey[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (prev.countryCode !== cur.countryCode) continue;
    const gap = diffInDays(prev.date, cur.date);
    if (gap >= 2 && gap <= thresholdDays) {
      let cursor = addOneDay(prev.date);
      while (cursor < cur.date) {
        fills.push({ countryCode: cur.countryCode, date: cursor });
        cursor = addOneDay(cursor);
      }
    }
  }
  return fills;
}
