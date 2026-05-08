import { diffInDays } from "../../features/travel/visit/dateUtils";
import type { RecentTrip } from "../../features/travel/visitRepository";

// 두 trip 사이 일수 차이. prev의 endDate와 next의 startDate 간격.
// 1 = 바로 다음날 (사이 빈 날 0), 2 = 사이 1일 빔, 3 = 사이 2일 빔, ...
export function gapBetween(prevEndDate: string, nextStartDate: string): number {
  return diffInDays(prevEndDate, nextStartDate);
}

// startDate 오름차순 정렬 후 인접 gap 중 하나라도 adjacentThreshold 초과면 true.
export function containsNonAdjacentGap(
  trips: RecentTrip[],
  adjacentThreshold: number
): boolean {
  if (trips.length < 2) return false;
  const sorted = [...trips].sort((a, b) =>
    a.startDate < b.startDate ? -1 : 1
  );
  for (let i = 1; i < sorted.length; i += 1) {
    if (
      gapBetween(sorted[i - 1].endDate, sorted[i].startDate) >
      adjacentThreshold
    ) {
      return true;
    }
  }
  return false;
}

// startDate 오름차순 정렬 후 인접 gap의 최댓값. 2개 미만이면 0.
export function maxGapDays(trips: RecentTrip[]): number {
  if (trips.length < 2) return 0;
  const sorted = [...trips].sort((a, b) =>
    a.startDate < b.startDate ? -1 : 1
  );
  let max = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = gapBetween(sorted[i - 1].endDate, sorted[i].startDate);
    if (gap > max) max = gap;
  }
  return max;
}
