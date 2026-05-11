// 비행 입력에서 시각 입력은 HH:MM (24시간제) 텍스트로 받는다.
// 사용자가 입력한 시각을 폰 로컬 timezone의 ms epoch으로 변환.
// 도착 시각이 출발 시각보다 같거나 작으면 "다음날"로 해석 (자정 넘는 야간 비행).

export function formatHm(epochMs: number): string {
  const d = new Date(epochMs);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function parseHm(input: string): { h: number; m: number } | null {
  const trimmed = input.trim();
  // 허용: "14:32", "1432", "9:5" (한 자리 OK).
  const colon = trimmed.includes(":")
    ? trimmed.split(":")
    : trimmed.length === 4
      ? [trimmed.slice(0, 2), trimmed.slice(2, 4)]
      : trimmed.length === 3
        ? [trimmed.slice(0, 1), trimmed.slice(1, 3)]
        : null;
  if (!colon || colon.length !== 2) return null;
  const h = Number(colon[0]);
  const m = Number(colon[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23) return null;
  if (m < 0 || m > 59) return null;
  return { h, m };
}

// HH:MM 텍스트를 "오늘 그 시각"의 ms epoch으로 변환. now 기준.
export function hmToEpochToday(h: number, m: number, now: number): number {
  const base = new Date(now);
  base.setHours(h, m, 0, 0);
  return base.getTime();
}

// 도착 시각 텍스트를 "출발 시각 이후 가장 가까운 동일 HH:MM"의 ms epoch으로 변환.
// 입력 시각이 출발 시각보다 작거나 같으면 24시간 더해 다음날로 해석.
export function hmToEpochAfter(
  h: number,
  m: number,
  afterEpoch: number
): number {
  const base = new Date(afterEpoch);
  base.setHours(h, m, 0, 0);
  let result = base.getTime();
  if (result <= afterEpoch) {
    result += 24 * 60 * 60 * 1000;
  }
  return result;
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

// 남은 시간(ms)을 "Xh Ym 남음" 형태로 포맷. 한국어/영어 키로 i18n 처리되는 caller가
// 따로 prefix를 붙이는 게 깔끔하지만, 간단한 표시용으로 여기 함수도 둔다.
export function formatRemainingShort(ms: number): string {
  return formatDurationMinutes(ms / 60_000);
}
