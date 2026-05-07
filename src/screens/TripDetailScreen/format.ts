// 날짜 표시 포맷터들. YYYY-MM-DD 입력만 받음.

export function formatDateLong(date: string): string {
  const [y, m, d] = date.split("-");
  return `${y} · ${m} · ${d}`;
}

export function formatDateShort(date: string): string {
  const [, m, d] = date.split("-");
  return `${m} · ${d}`;
}

export function formatDateShortDot(date: string): string {
  const [, m, d] = date.split("-");
  return `${m}.${d}`;
}
