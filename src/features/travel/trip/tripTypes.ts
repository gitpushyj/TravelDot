// 트립 한 줄. country_code 안에서 [startDate, endDate] 구간을 한 여행으로 표현한다.
// 도트지도/카운트는 이 트립 row를 펼쳐서 derive한다.
export type Trip = {
  id: string;
  countryCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  body: string | null;
  createdAt: number; // ms (로컬). 원격은 timestamptz, sync 경계에서 변환.
  updatedAt: number; // ms. LWW 비교 기준.
};

// SQLite 행 형태. snake_case는 DB 경계 안에서만 쓰고 외부엔 Trip만 노출한다.
export type TripRow = {
  id: string;
  country_code: string;
  start_date: string;
  end_date: string;
  body: string | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

export function rowToTrip(r: TripRow): Trip {
  return {
    id: r.id,
    countryCode: r.country_code,
    startDate: r.start_date,
    endDate: r.end_date,
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
