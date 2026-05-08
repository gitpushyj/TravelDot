import { addOneDay, subOneDay } from "../visit/dateUtils";
import { getTripDb } from "./tripDb";
import { newTripId } from "./tripId";
import { planIngestVisitDay, type IngestPlan } from "./tripIngestPlan";

export type IngestAction = IngestPlan["kind"];

export type IngestResult = {
  tripId: string;
  action: IngestAction;
};

type ViewRow = { id: string; start_date: string; end_date: string };

// 자동 탐지(또는 수동 추가)에서 (country, date) 신호가 들어왔을 때
// trips 테이블을 한 트랜잭션으로 갱신한다.
// - 이미 포함하는 트립이면 noop
// - 인접 트립 한쪽: 그쪽 트립 확장
// - 양쪽 인접: 두 트립 병합
// - 없으면 단일일 트립 신규 생성
export async function ingestVisitDay(input: {
  countryCode: string;
  date: string;
}): Promise<IngestResult> {
  const { countryCode, date } = input;
  const db = await getTripDb();
  let result!: IngestResult;

  await db.withTransactionAsync(async () => {
    const containing = await db.getFirstAsync<ViewRow>(
      `SELECT id, start_date, end_date FROM trips
        WHERE country_code = ? AND deleted_at IS NULL
          AND start_date <= ? AND end_date >= ?
        LIMIT 1`,
      countryCode,
      date,
      date
    );

    const left = containing
      ? null
      : await db.getFirstAsync<ViewRow>(
          `SELECT id, start_date, end_date FROM trips
            WHERE country_code = ? AND deleted_at IS NULL
              AND end_date = ?
            LIMIT 1`,
          countryCode,
          subOneDay(date)
        );
    const right = containing
      ? null
      : await db.getFirstAsync<ViewRow>(
          `SELECT id, start_date, end_date FROM trips
            WHERE country_code = ? AND deleted_at IS NULL
              AND start_date = ?
            LIMIT 1`,
          countryCode,
          addOneDay(date)
        );

    const plan = planIngestVisitDay({
      date,
      containing: containing ? toView(containing) : null,
      left: left ? toView(left) : null,
      right: right ? toView(right) : null,
    });

    const now = Date.now();

    switch (plan.kind) {
      case "noop":
        result = { tripId: plan.tripId, action: "noop" };
        return;
      case "extend":
        await db.runAsync(
          `UPDATE trips SET start_date = ?, end_date = ?, updated_at = ?
            WHERE id = ?`,
          plan.newStart,
          plan.newEnd,
          now,
          plan.tripId
        );
        result = { tripId: plan.tripId, action: "extend" };
        return;
      case "merge":
        await db.runAsync(
          `UPDATE trips SET start_date = ?, end_date = ?, updated_at = ?
            WHERE id = ?`,
          plan.newStart,
          plan.newEnd,
          now,
          plan.keepId
        );
        await db.runAsync(
          `UPDATE trips SET deleted_at = ?, updated_at = ?
            WHERE id = ?`,
          now,
          now,
          plan.absorbId
        );
        result = { tripId: plan.keepId, action: "merge" };
        return;
      case "create": {
        const id = newTripId();
        await db.runAsync(
          `INSERT INTO trips (id, country_code, start_date, end_date, body, created_at, updated_at)
           VALUES (?, ?, ?, ?, NULL, ?, ?)`,
          id,
          countryCode,
          plan.date,
          plan.date,
          now,
          now
        );
        result = { tripId: id, action: "create" };
        return;
      }
    }
  });

  return result;
}

function toView(r: ViewRow) {
  return { id: r.id, startDate: r.start_date, endDate: r.end_date };
}
