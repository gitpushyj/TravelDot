// AddTripScreen 전용 EXIF 파서. GPS 좌표와 촬영 시각만 추출한다.

export function exifNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function exifLatLng(exif: Record<string, unknown> | undefined): {
  lat: number;
  lng: number;
} | null {
  if (!exif) return null;
  let lat = exifNumber(exif.GPSLatitude);
  let lng = exifNumber(exif.GPSLongitude);
  if (lat == null || lng == null) return null;
  const latRef = exif.GPSLatitudeRef;
  const lngRef = exif.GPSLongitudeRef;
  if (latRef === "S") lat = -Math.abs(lat);
  if (lngRef === "W") lng = -Math.abs(lng);
  return { lat, lng };
}

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
  // EXIF format: "YYYY:MM:DD HH:MM:SS"
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
