import { getDb } from "../db";
import { computeBridgeFills, type DayKey } from "./bridgeFills";
import { addOneDay, ensureVisitDay } from "./internal";

// 자동 병합: 같은 국가에서 인접 visit_days 사이 gap이 2~thresholdDays이면
// 사이 빈 날짜를 visit_days로 채운다. 단일 transaction.
export async function bridgeNearbyVisitDays(
  thresholdDays: number = 3
): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ country_code: string; date: string }>(
    `SELECT country_code, date FROM visit_days
      WHERE deleted_at IS NULL
      ORDER BY country_code, date`
  );
  const days: DayKey[] = rows.map((r) => ({
    countryCode: r.country_code,
    date: r.date,
  }));
  const fills = computeBridgeFills(days, thresholdDays);
  if (fills.length === 0) return;
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const f of fills) {
      await ensureVisitDay(f.countryCode, f.date, now);
    }
  });
}

// 수동 병합: 지정 국가의 [startDate, endDate] 모든 날짜에 visit_days를 보장한다.
// 결과적으로 그 범위 안에 있던 분리된 trip들이 하나의 연속 trip으로 묶인다.
// `createTrip`과 본질적으로 같은 동작이지만, 도메인 의도(여행 병합)를 드러내기 위해
// 별도 export. 미래에 분리 기능이 도입될 때 두 함수의 의미가 달라질 수 있다.
export async function mergeTrips(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<void> {
  if (startDate > endDate) {
    throw new Error("mergeTrips: startDate after endDate");
  }
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    let cur = startDate;
    while (cur <= endDate) {
      await ensureVisitDay(countryCode, cur, now);
      cur = addOneDay(cur);
    }
  });
}
