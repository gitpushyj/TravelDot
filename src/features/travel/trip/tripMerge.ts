import { notifyTripsChanged } from "../../travelSync/notifyTripsChanged";
import { getTripDb } from "./tripDb";
import { newTripId } from "./tripId";
import {
  planConsolidations,
  type ConsolidationOp,
  type ConsolidationRow,
  type PlanOptions,
} from "./tripConsolidationPlan";

// 자동 병합: 같은 country에서 인접 트립 두 개의 gap이 ≤ thresholdDays이면 합친다.
// 한 번 호출로 chained merge까지 처리하기 위해 각 country를 ASC로 훑으면서 그룹을 모은다.
// gap = 1 → 인접 (이미 연속), gap = 2..threshold → 사이 빈 날짜를 다리로 묶음.
// 첫 스캔 직후 1회만 호출(이후 스캔에선 사용자의 수동 결정을 보존하기 위해 미실행).
export async function bridgeNearbyVisitDays(
  thresholdDays: number = 3
): Promise<void> {
  await runConsolidation({
    adjacentThresholdDays: thresholdDays,
    includeOverlap: false,
  });
}

// cross-device pull 직후 호출. 다른 기기에서 병합된 결과(긴 범위 트립)와
// 로컬의 개별 트립이 같은 country에서 겹치는 케이스를 정리한다.
// 인접(gap=1..3) 자동 병합은 끄고 overlap(gap ≤ 0)만 흡수하기 때문에
// 사용자가 한쪽 기기에서 의도적으로 분리해둔 인접 트립을 자동으로 다시 합치지 않는다.
export async function collapseOverlappingTrips(): Promise<void> {
  await runConsolidation({
    adjacentThresholdDays: 0,
    includeOverlap: true,
  });
}

async function runConsolidation(opts: PlanOptions): Promise<void> {
  const db = await getTripDb();
  const rows = await db.getAllAsync<ConsolidationRow>(
    `SELECT id, country_code, start_date, end_date
       FROM trips
      WHERE deleted_at IS NULL
      ORDER BY country_code, start_date`
  );
  const ops = planConsolidations(rows, opts);
  if (ops.length === 0) return;
  await applyConsolidationOps(ops);
  notifyTripsChanged();
}

async function applyConsolidationOps(ops: ConsolidationOp[]): Promise<void> {
  const db = await getTripDb();
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
