import i18n from "../../../i18n";
import { getDb } from "../db";
import type { RecentTrip, TripWithPhotos } from "./types";
import { addOneDay, diffInDays, ensureVisitDay } from "./internal";

// 나라별 가장 최근 "여행" = 마지막 날짜에서 거꾸로 거슬러 올라가며 연속된 날짜의 묶음.
// 결과는 시작일 기준 내림차순 정렬.
export async function loadRecentTripsByCountry(): Promise<RecentTrip[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ country_code: string; date: string }>(
    `SELECT country_code, date
       FROM visit_days
      WHERE deleted_at IS NULL
      ORDER BY country_code, date`
  );
  const byCountry = new Map<string, string[]>();
  for (const r of rows) {
    const arr = byCountry.get(r.country_code) ?? [];
    arr.push(r.date);
    byCountry.set(r.country_code, arr);
  }
  const trips: RecentTrip[] = [];
  for (const [code, dates] of byCountry) {
    if (dates.length === 0) continue;
    // dates는 ASC. 마지막에서부터 연속 구간을 찾는다.
    const endDate = dates[dates.length - 1];
    let startDate = endDate;
    let i = dates.length - 2;
    while (i >= 0 && diffInDays(dates[i], startDate) === 1) {
      startDate = dates[i];
      i -= 1;
    }
    const days = diffInDays(startDate, endDate) + 1;
    trips.push({ countryCode: code, startDate, endDate, days });
  }
  trips.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  return trips;
}

// 모든 나라의 모든 "여행"(연속된 방문일 묶음)을 한 번에 반환. 사진 수까지 채움.
// 시작일 내림차순.
export async function loadAllTrips(): Promise<TripWithPhotos[]> {
  const db = await getDb();
  const dayRows = await db.getAllAsync<{ country_code: string; date: string }>(
    `SELECT country_code, date
       FROM visit_days
      WHERE deleted_at IS NULL
      ORDER BY country_code, date`
  );
  if (dayRows.length === 0) return [];

  const photoRows = await db.getAllAsync<{
    country_code: string;
    date: string;
    n: number;
  }>(
    `SELECT country_code, date, COUNT(*) AS n
       FROM visit_photos
      WHERE deleted_at IS NULL
      GROUP BY country_code, date`
  );
  const photoByKey = new Map<string, number>();
  for (const r of photoRows) {
    photoByKey.set(`${r.country_code}|${r.date}`, r.n);
  }

  const trips: TripWithPhotos[] = [];
  let i = 0;
  while (i < dayRows.length) {
    const code = dayRows[i].country_code;
    let startDate = dayRows[i].date;
    let prev = startDate;
    let photos = photoByKey.get(`${code}|${startDate}`) ?? 0;
    let j = i + 1;
    while (
      j < dayRows.length &&
      dayRows[j].country_code === code &&
      diffInDays(prev, dayRows[j].date) === 1
    ) {
      prev = dayRows[j].date;
      photos += photoByKey.get(`${code}|${prev}`) ?? 0;
      j += 1;
    }
    trips.push({
      countryCode: code,
      startDate,
      endDate: prev,
      days: diffInDays(startDate, prev) + 1,
      photos,
    });
    i = j;
  }
  trips.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  return trips;
}

// 특정 나라의 모든 "여행"(연속된 방문일 묶음). 시작일 내림차순으로 반환.
export async function loadTripsForCountry(
  countryCode: string
): Promise<RecentTrip[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ date: string }>(
    `SELECT date FROM visit_days
      WHERE country_code = ? AND deleted_at IS NULL
      ORDER BY date ASC`,
    countryCode
  );
  if (rows.length === 0) return [];
  const trips: RecentTrip[] = [];
  let startDate = rows[0].date;
  let prev = startDate;
  for (let i = 1; i < rows.length; i += 1) {
    const cur = rows[i].date;
    if (diffInDays(prev, cur) === 1) {
      prev = cur;
      continue;
    }
    trips.push({
      countryCode,
      startDate,
      endDate: prev,
      days: diffInDays(startDate, prev) + 1,
    });
    startDate = cur;
    prev = cur;
  }
  trips.push({
    countryCode,
    startDate,
    endDate: prev,
    days: diffInDays(startDate, prev) + 1,
  });
  trips.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  return trips;
}

// 한 "여행"(연속된 방문일 묶음)을 통째로 삭제한다.
// visit_days / visit_photos / visit_notes 모두 soft-delete 처리.
export async function deleteTrip(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE visit_days
          SET deleted_at = ?, updated_at = ?
        WHERE country_code = ?
          AND date BETWEEN ? AND ?
          AND deleted_at IS NULL`,
      now,
      now,
      countryCode,
      startDate,
      endDate
    );
    await db.runAsync(
      `UPDATE visit_photos
          SET deleted_at = ?, updated_at = ?
        WHERE country_code = ?
          AND date BETWEEN ? AND ?
          AND deleted_at IS NULL`,
      now,
      now,
      countryCode,
      startDate,
      endDate
    );
    await db.runAsync(
      `UPDATE visit_notes
          SET deleted_at = ?, updated_at = ?
        WHERE country_code = ?
          AND date BETWEEN ? AND ?
          AND deleted_at IS NULL`,
      now,
      now,
      countryCode,
      startDate,
      endDate
    );
  });
}

// 한 "여행"의 시작·종료일을 새 범위로 갱신한다.
// - 새 범위 안의 모든 날짜에 대해 visit_days를 보장(언삭제 + insert).
// - 기존 범위 안이지만 새 범위 밖에 있는 visit_days/photos/notes는 soft-delete.
// 새 범위 자체에 photo가 없는 빈 날짜라도 visit_days로는 남아있어 "여행 일수"에 포함된다.
export async function updateTripDates(
  countryCode: string,
  oldStartDate: string,
  oldEndDate: string,
  newStartDate: string,
  newEndDate: string
): Promise<void> {
  if (newStartDate > newEndDate) {
    throw new Error(i18n.t("errors.trip.startAfterEnd"));
  }
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    // 기존 범위 안 + 새 범위 밖 → soft-delete.
    const trimSql = (table: string) =>
      `UPDATE ${table}
          SET deleted_at = ?, updated_at = ?
        WHERE country_code = ?
          AND date BETWEEN ? AND ?
          AND (date < ? OR date > ?)
          AND deleted_at IS NULL`;
    for (const t of ["visit_days", "visit_photos", "visit_notes"]) {
      await db.runAsync(
        trimSql(t),
        now,
        now,
        countryCode,
        oldStartDate,
        oldEndDate,
        newStartDate,
        newEndDate
      );
    }
    // 새 범위의 모든 날짜에 visit_days 보장.
    let cur = newStartDate;
    while (cur <= newEndDate) {
      await ensureVisitDay(countryCode, cur, now);
      cur = addOneDay(cur);
    }
  });
}
