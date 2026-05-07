// EXIF의 DateTimeOriginal/Digitized/DateTime을 우선순위대로 시도해 takenAt(ms)을 추출.
// 형식이 어긋나거나 EXIF가 비면 fallback을 그대로 돌려준다.
export function exifTakenAt(
  exif: Record<string, unknown> | undefined,
  fallback: number
): number {
  if (!exif) return fallback;
  const raw =
    (exif.DateTimeOriginal as string | undefined) ||
    (exif.DateTimeDigitized as string | undefined) ||
    (exif.DateTime as string | undefined);
  if (!raw) return fallback;
  const m = raw.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return fallback;
  const [, y, mo, d, hh, mm, ss] = m;
  const ms = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss)
  ).getTime();
  return Number.isFinite(ms) ? ms : fallback;
}

export function dayCount(start: string, end: string): number {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const a = Date.UTC(sy, sm - 1, sd);
  const b = Date.UTC(ey, em - 1, ed);
  return Math.round((b - a) / 86400000) + 1;
}
