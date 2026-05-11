// 비행 상태 표시용 시각/시간 포맷 유틸.

// epoch(ms)을 폰 로컬 timezone의 "HH:MM"으로 포맷.
export function formatHm(epochMs: number): string {
  const d = new Date(epochMs);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

// 분 단위 차이를 "Xh Ym" 또는 "Ym" 형태로 포맷.
export function formatDurationMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m - h * 60;
  if (rest === 0) return `${h}h`;
  return `${h}h ${rest}m`;
}

// 남은 시간(ms)을 "Xh Ym" 형태로 포맷. caller가 "남음" 같은 라벨을 별도로 붙인다.
export function formatRemainingShort(ms: number): string {
  return formatDurationMinutes(ms / 60_000);
}
