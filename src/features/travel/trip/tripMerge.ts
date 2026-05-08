import { notifyTripsChanged } from "../../travelSync/notifyTripsChanged";
import { diffInDays } from "../visit/dateUtils";
import { getTripDb } from "./tripDb";
import { newTripId } from "./tripId";

// 자동 병합: 같은 country에서 인접 트립 두 개의 gap이 ≤ thresholdDays이면 합친다.
// 한 번 호출로 chained merge까지 처리하기 위해 각 country를 ASC로 훑으면서 그룹을 모은다.
// gap 정의는 기존 visit_days 시대와 동일: 두 트립의 (다음 시작 - 이전 끝) 일수 차이.
//   gap = 1 → 인접 (이미 연속), gap = 2..threshold → 사이 빈 날짜를 다리로 묶음.
// gap = 1도 같이 합쳐 둔다(이론상 ingestVisitDay에서 처리되지만 인입 경로 누락 대비).
export async function bridgeNearbyVisitDays(
  thresholdDays: number = 3
): Promise<void> {
  const db = await getTripDb();
  const rows = await db.getAllAsync<{
    id: string;
    country_code: string;
    start_date: string;
    end_date: string;
  }>(
    `SELECT id, country_code, start_date, end_date
       FROM trips
      WHERE deleted_at IS NULL
      ORDER BY country_code, start_date`
  );

  type MergeOp = { keepId: string; newEnd: string; absorbIds: string[] };
  const ops: MergeOp[] = [];

  let curCountry: string | null = null;
  let cur: MergeOp | null = null;
  let curEnd = "";

  const flush = () => {
    if (cur && cur.absorbIds.length > 0) ops.push(cur);
    cur = null;
  };

  for (const r of rows) {
    if (r.country_code !== curCountry) {
      flush();
      curCountry = r.country_code;
      cur = { keepId: r.id, newEnd: r.end_date, absorbIds: [] };
      curEnd = r.end_date;
      continue;
    }
    const gap = diffInDays(curEnd, r.start_date);
    if (gap >= 1 && gap <= thresholdDays) {
      if (!cur) cur = { keepId: r.id, newEnd: r.end_date, absorbIds: [] };
      else {
        cur.absorbIds.push(r.id);
        if (r.end_date > cur.newEnd) cur.newEnd = r.end_date;
      }
      curEnd = r.end_date;
    } else {
      flush();
      cur = { keepId: r.id, newEnd: r.end_date, absorbIds: [] };
      curEnd = r.end_date;
    }
  }
  flush();

  if (ops.length === 0) return;

  await db.withTransactionAsync(async () => {
    const now = Date.now();
    for (const op of ops) {
      await db.runAsync(
        `UPDATE trips SET end_date = ?, updated_at = ? WHERE id = ?`,
        op.newEnd,
        now,
        op.keepId
      );
      for (const aid of op.absorbIds) {
        await db.runAsync(
          `UPDATE trips SET deleted_at = ?, updated_at = ? WHERE id = ?`,
          now,
          now,
          aid
        );
      }
    }
  });
  notifyTripsChanged();
}

// 수동 병합: 지정 country에서 [startDate, endDate]와 겹치는 모든 트립을
// 하나로 합친다. 결과 트립의 새 범위는 (요청 범위 ∪ 겹친 트립들의 범위).
// 겹치는 트립이 없으면 [startDate, endDate]로 신규 트립을 만든다.
export async function mergeTrips(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<void> {
  if (startDate > endDate) {
    throw new Error("mergeTrips: startDate after endDate");
  }
  const db = await getTripDb();
  const rows = await db.getAllAsync<{
    id: string;
    start_date: string;
    end_date: string;
  }>(
    `SELECT id, start_date, end_date FROM trips
      WHERE country_code = ? AND deleted_at IS NULL
        AND NOT (end_date < ? OR start_date > ?)
      ORDER BY start_date`,
    countryCode,
    startDate,
    endDate
  );

  let newStart = startDate;
  let newEnd = endDate;
  for (const r of rows) {
    if (r.start_date < newStart) newStart = r.start_date;
    if (r.end_date > newEnd) newEnd = r.end_date;
  }

  const now = Date.now();
  await db.withTransactionAsync(async () => {
    if (rows.length === 0) {
      await db.runAsync(
        `INSERT INTO trips (id, country_code, start_date, end_date, body, created_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?)`,
        newTripId(),
        countryCode,
        newStart,
        newEnd,
        now,
        now
      );
      return;
    }
    const keepId = rows[0].id;
    await db.runAsync(
      `UPDATE trips SET start_date = ?, end_date = ?, updated_at = ?
        WHERE id = ?`,
      newStart,
      newEnd,
      now,
      keepId
    );
    for (let i = 1; i < rows.length; i += 1) {
      await db.runAsync(
        `UPDATE trips SET deleted_at = ?, updated_at = ? WHERE id = ?`,
        now,
        now,
        rows[i].id
      );
    }
  });
  notifyTripsChanged();
}
