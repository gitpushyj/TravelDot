import type { TripWithPhotos } from "../../features/travel/visitRepository";

export type YearGroup = { year: number; trips: TripWithPhotos[] };

export function groupByYear(trips: TripWithPhotos[]): YearGroup[] {
  const map = new Map<number, TripWithPhotos[]>();
  for (const t of trips) {
    const y = Number(t.startDate.slice(0, 4));
    const arr = map.get(y) ?? [];
    arr.push(t);
    map.set(y, arr);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, list]) => ({ year, trips: list }));
}

// "MM·DD" 형태로 짧게 표시.
export function formatMD(date: string): string {
  return `${date.slice(5, 7)}·${date.slice(8, 10)}`;
}
