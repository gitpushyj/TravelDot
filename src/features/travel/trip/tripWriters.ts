import {
  trackTripCreated,
  trackTripDeleted,
  trackTripEdited,
} from "../../../lib/analyticsEvents";
import { notifyTripsChanged } from "../../travelSync/notifyTripsChanged";
import { getTripDb } from "./tripDb";
import {
  createTrip as createTripRow,
  softDeleteTrip,
  updateTripDates as updateTripDatesById,
} from "./tripRepository";

// YYYY-MM-DD 두 날짜 사이 일수(포함). 잘못된 범위면 0.
function durationDays(startDate: string, endDate: string): number {
  const startMs = Date.parse(startDate);
  const endMs = Date.parse(endDate);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0;
  const diff = Math.round((endMs - startMs) / 86_400_000);
  return diff >= 0 ? diff + 1 : 0;
}

// 기존 호출 측이 쓰던 (country, start, end) 시그니처를 그대로 받는 호환 wrapper.
// 내부에선 tripRepository의 id 기반 함수로 변환한다.

export async function createTrip(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<void> {
  await createTripRow({ countryCode, startDate, endDate });
  trackTripCreated({
    countryCode,
    durationDays: durationDays(startDate, endDate),
    source: "manual",
  });
  notifyTripsChanged();
}

// (country, oldStart, oldEnd)로 트립을 찾아 새 범위로 갱신.
// 매칭이 없으면 noop — 호출 측은 보통 화면에 떠 있는 트립을 그대로 넘기므로 발생하지 않는다.
export async function updateTripDates(
  countryCode: string,
  oldStartDate: string,
  oldEndDate: string,
  newStartDate: string,
  newEndDate: string
): Promise<void> {
  const id = await findTripIdByExactRange(countryCode, oldStartDate, oldEndDate);
  if (!id) return;
  await updateTripDatesById({
    id,
    startDate: newStartDate,
    endDate: newEndDate,
  });
  trackTripEdited({
    countryCode,
    oldDurationDays: durationDays(oldStartDate, oldEndDate),
    newDurationDays: durationDays(newStartDate, newEndDate),
  });
  notifyTripsChanged();
}

export async function deleteTrip(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const id = await findTripIdByExactRange(countryCode, startDate, endDate);
  if (!id) return;
  await softDeleteTrip(id);
  trackTripDeleted({
    countryCode,
    durationDays: durationDays(startDate, endDate),
    source: "manual",
  });
  notifyTripsChanged();
}

async function findTripIdByExactRange(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<string | null> {
  const db = await getTripDb();
  const row = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM trips
      WHERE country_code = ?
        AND start_date = ?
        AND end_date = ?
        AND deleted_at IS NULL
      LIMIT 1`,
    countryCode,
    startDate,
    endDate
  );
  return row?.id ?? null;
}
