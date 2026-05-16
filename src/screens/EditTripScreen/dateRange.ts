import { isValidDateKey } from "../../utils/date";

import { dayCount } from "./exif";

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

// 시작일을 옮긴 결과를 [start, end] 쌍으로 돌려준다.
// 새 시작이 기존 종료보다 뒤면 기존 기간(span)을 유지하며 종료도 함께 이동한다.
// 그 외에는 종료를 건드리지 않는다.
export function applyStartChange(
  newStart: string,
  oldStart: string,
  oldEnd: string
): { start: string; end: string } {
  if (
    !isValidDateKey(newStart) ||
    !isValidDateKey(oldStart) ||
    !isValidDateKey(oldEnd) ||
    newStart <= oldEnd
  ) {
    return { start: newStart, end: oldEnd };
  }
  const span = dayCount(oldStart, oldEnd) - 1;
  return { start: newStart, end: addDays(newStart, span) };
}

// 종료일을 옮긴 결과를 [start, end] 쌍으로 돌려준다.
// 새 종료가 기존 시작보다 앞이면 기존 기간(span)을 유지하며 시작도 함께 이동한다.
// 그 외에는 시작을 건드리지 않는다.
export function applyEndChange(
  newEnd: string,
  oldStart: string,
  oldEnd: string
): { start: string; end: string } {
  if (
    !isValidDateKey(newEnd) ||
    !isValidDateKey(oldStart) ||
    !isValidDateKey(oldEnd) ||
    newEnd >= oldStart
  ) {
    return { start: oldStart, end: newEnd };
  }
  const span = dayCount(oldStart, oldEnd) - 1;
  return { start: addDays(newEnd, -span), end: newEnd };
}
