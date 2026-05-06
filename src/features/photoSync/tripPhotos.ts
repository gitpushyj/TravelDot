import { toLocalDateKey } from "../../utils/date";
import { ensurePermission, iteratePhotos } from "./photoLibrary";
import { resolveCountry } from "./countryResolver";

export type DeviceTripPhoto = {
  id: string;
  uri: string;
  takenAt: number;
  date: string;
};

// 기기 사진첩에서 (countryCode, [startDate, endDate]) 조건에 맞는 사진을 스캔한다.
// startDate/endDate는 YYYY-MM-DD (포함 양끝). takenAt 내림차순(최신순)으로 반환.
// limit이 주어지면 그만큼 채우는 즉시 중단한다(빠른 미리보기용).
export async function scanDevicePhotosForTrip(opts: {
  countryCode: string;
  startDate: string;
  endDate: string;
  limit?: number;
}): Promise<DeviceTripPhoto[]> {
  const { countryCode, startDate, endDate, limit } = opts;
  const permission = await ensurePermission();
  if (permission === "denied") return [];

  // expo-media-library는 createdAfter/createdBefore를 epoch ms로 받는다.
  // 종료일은 그날 23:59:59.999까지 포함하도록 다음날 0시 - 1ms로 잡는다.
  const startMs = parseLocalDateMs(startDate);
  const endMs = parseLocalDateMs(endDate) + 24 * 60 * 60 * 1000 - 1;

  const out: DeviceTripPhoto[] = [];
  for await (const p of iteratePhotos(200, {
    createdAfter: startMs,
    createdBefore: endMs,
  })) {
    if (p.lat == null || p.lng == null) continue;
    const code = resolveCountry(p.lat, p.lng);
    if (code !== countryCode) continue;
    out.push({
      id: p.id,
      uri: p.uri,
      takenAt: p.takenAt,
      date: toLocalDateKey(p.takenAt),
    });
    if (limit != null && out.length >= limit) break;
  }
  // iteratePhotos는 최신→과거 순. 그대로가 takenAt DESC.
  return out;
}

function parseLocalDateMs(date: string): number {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7)) - 1;
  const d = Number(date.slice(8, 10));
  return new Date(y, m, d, 0, 0, 0, 0).getTime();
}
