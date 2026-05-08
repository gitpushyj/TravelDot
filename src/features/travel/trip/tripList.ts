import { listTrips, listTripsByCountry } from "./tripRepository";
import { tripDayCount } from "./tripDays";
import { countPhotosForTrip } from "./tripPhotoCounts";

// 외부에 노출하는 트립 read 모델.
// 기존 RecentTrip / TripWithPhotos 인터페이스와 동일한 모양으로 derive 한다.

export type RecentTrip = {
  countryCode: string;
  startDate: string;
  endDate: string;
  days: number;
};

// id/body는 새 모델에서 채워지는 정보지만 화면이 RecentTrip + photos만으로 직접
// 합성하는 경로(loadTripsForCountry → setState 조합 등)도 있어 호환을 위해 optional.
export type TripWithPhotos = RecentTrip & {
  photos: number;
  id?: string;
  body?: string | null;
};

// 모든 트립을 시작일 내림차순으로. 사진 수까지 채워서 반환.
export async function loadAllTrips(): Promise<TripWithPhotos[]> {
  const trips = await listTrips();
  const out: TripWithPhotos[] = [];
  for (const t of trips) {
    const photos = await countPhotosForTrip(t.countryCode, t.startDate, t.endDate);
    out.push({
      id: t.id,
      countryCode: t.countryCode,
      startDate: t.startDate,
      endDate: t.endDate,
      days: tripDayCount(t),
      photos,
      body: t.body,
    });
  }
  return out;
}

// 국가별 가장 최근 트립 1개씩. 시작일 내림차순.
// listTrips()가 이미 시작일 내림차순이라 첫 만남 시점에서 채택.
export async function loadRecentTripsByCountry(): Promise<RecentTrip[]> {
  const trips = await listTrips();
  const seen = new Set<string>();
  const out: RecentTrip[] = [];
  for (const t of trips) {
    if (seen.has(t.countryCode)) continue;
    seen.add(t.countryCode);
    out.push({
      countryCode: t.countryCode,
      startDate: t.startDate,
      endDate: t.endDate,
      days: tripDayCount(t),
    });
  }
  return out;
}

// 특정 국가의 모든 트립. 시작일 내림차순.
export async function loadTripsForCountry(
  countryCode: string
): Promise<RecentTrip[]> {
  const trips = await listTripsByCountry(countryCode);
  return trips.map((t) => ({
    countryCode: t.countryCode,
    startDate: t.startDate,
    endDate: t.endDate,
    days: tripDayCount(t),
  }));
}
