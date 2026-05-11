import { notifyTripsChanged } from "../../travelSync/notifyTripsChanged";
import { getTripDb } from "./tripDb";
import { ingestVisitDay } from "./tripIngest";

export type VisitPhotoInput = {
  id: string;
  countryCode: string;
  date: string;
  localUri: string;
  source: "auto" | "manual";
  takenAt: number;
  deviceMake?: string | null;
  deviceModel?: string | null;
};

export type TripPhoto = {
  id: string;
  countryCode: string;
  date: string;
  localUri: string;
  takenAt: number;
  source: "auto" | "manual";
};

export type VisitPhotoForReview = {
  id: string;
  countryCode: string;
  date: string;
  takenAt: number;
  deviceMake: string | null;
  deviceModel: string | null;
  deviceCheckedAt: number | null;
};

// 사진 일괄 INSERT. (country, date) 그룹마다 한 번씩 ingestVisitDay를 호출해 트립을 자동 갱신한다.
export async function addPhotos(inputs: VisitPhotoInput[]): Promise<number> {
  if (inputs.length === 0) return 0;
  const db = await getTripDb();
  const now = Date.now();
  let inserted = 0;

  // 1) (country, date) 그룹별로 사진 INSERT — 트랜잭션으로 보호.
  const acceptedGroups: { countryCode: string; date: string }[] = [];
  await db.withTransactionAsync(async () => {
    const groups = new Map<string, VisitPhotoInput[]>();
    for (const i of inputs) {
      const k = `${i.countryCode}|${i.date}`;
      const arr = groups.get(k) ?? [];
      arr.push(i);
      groups.set(k, arr);
    }
    for (const [, items] of groups) {
      const { countryCode, date } = items[0];
      let groupInserted = 0;
      for (const ph of items) {
        const hasDevice =
          ph.deviceMake !== undefined || ph.deviceModel !== undefined;
        const r = await db.runAsync(
          `INSERT OR IGNORE INTO visit_photos
             (id, country_code, date, local_uri, remote_url, source, taken_at, updated_at,
              device_make, device_model, device_checked_at)
           VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
          ph.id,
          ph.countryCode,
          ph.date,
          ph.localUri,
          ph.source,
          ph.takenAt,
          now,
          ph.deviceMake ?? null,
          ph.deviceModel ?? null,
          hasDevice ? now : null
        );
        if (r.changes > 0) groupInserted += 1;
      }
      if (groupInserted > 0) {
        inserted += groupInserted;
        acceptedGroups.push({ countryCode, date });
      }
    }
  });

  // 2) 새로 사진이 들어간 그룹마다 트립 갱신.
  // ingestVisitDay 자체가 트랜잭션이라 사진 트랜잭션과 분리해 호출한다.
  for (const g of acceptedGroups) {
    await ingestVisitDay({ countryCode: g.countryCode, date: g.date });
  }
  if (acceptedGroups.length > 0) notifyTripsChanged();
  return inserted;
}

export async function loadPhotosForTrip(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<TripPhoto[]> {
  const db = await getTripDb();
  const rows = await db.getAllAsync<{
    id: string;
    country_code: string;
    date: string;
    local_uri: string | null;
    taken_at: number;
    source: "auto" | "manual";
  }>(
    `SELECT id, country_code, date, local_uri, taken_at, source
       FROM visit_photos
      WHERE country_code = ?
        AND date BETWEEN ? AND ?
        AND deleted_at IS NULL
        AND local_uri IS NOT NULL
      ORDER BY taken_at ASC`,
    countryCode,
    startDate,
    endDate
  );
  return rows
    .filter((r) => !!r.local_uri)
    .map((r) => ({
      id: r.id,
      countryCode: r.country_code,
      date: r.date,
      localUri: r.local_uri as string,
      takenAt: r.taken_at,
      source: r.source,
    }));
}

// 디바이스 검증용 — user_reviewed_at가 채워진 사진은 재검토 후보에서 영구 제외.
export async function loadAllPhotosForReview(): Promise<VisitPhotoForReview[]> {
  const db = await getTripDb();
  const rows = await db.getAllAsync<{
    id: string;
    country_code: string;
    date: string;
    taken_at: number;
    device_make: string | null;
    device_model: string | null;
    device_checked_at: number | null;
  }>(
    `SELECT id, country_code, date, taken_at,
            device_make, device_model, device_checked_at
       FROM visit_photos
      WHERE deleted_at IS NULL
        AND user_reviewed_at IS NULL
      ORDER BY country_code, date`
  );
  return rows.map((r) => ({
    id: r.id,
    countryCode: r.country_code,
    date: r.date,
    takenAt: r.taken_at,
    deviceMake: r.device_make,
    deviceModel: r.device_model,
    deviceCheckedAt: r.device_checked_at,
  }));
}

// 의심 여행 미리보기용. soft-delete된 행은 제외.
export async function loadPhotoUrisByIds(
  ids: string[]
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const db = await getTripDb();
  const out: Record<string, string> = {};
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    const placeholders = chunk.map(() => "?").join(",");
    const rows = await db.getAllAsync<{ id: string; local_uri: string | null }>(
      `SELECT id, local_uri FROM visit_photos
        WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      ...chunk
    );
    for (const r of rows) {
      if (r.local_uri) out[r.id] = r.local_uri;
    }
  }
  return out;
}

// 사용자가 "내 여행 맞음" 확인한 사진 표시. 다음 리뷰에서 제외.
export async function markPhotosUserReviewed(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getTripDb();
  const now = Date.now();
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    const placeholders = chunk.map(() => "?").join(",");
    await db.runAsync(
      `UPDATE visit_photos
          SET user_reviewed_at = ?
        WHERE id IN (${placeholders})`,
      now,
      ...chunk
    );
  }
}

export async function updatePhotoDevices(
  updates: { id: string; make: string | null; model: string | null }[]
): Promise<void> {
  if (updates.length === 0) return;
  const db = await getTripDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const u of updates) {
      await db.runAsync(
        `UPDATE visit_photos
            SET device_make = ?, device_model = ?, device_checked_at = ?
          WHERE id = ?`,
        u.make,
        u.model,
        now,
        u.id
      );
    }
  });
}

// 디바이스 사진첩 스캔에서 사용자가 명시적으로 제거한 자산을 걸러내기 위한
// tombstone 목록. visit_photos.id == MediaLibrary asset id이므로 스캔 결과의
// id 집합에 그대로 매칭된다.
export async function loadDeletedPhotoIdsForTrip(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<string[]> {
  const db = await getTripDb();
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM visit_photos
      WHERE country_code = ?
        AND date BETWEEN ? AND ?
        AND deleted_at IS NOT NULL`,
    countryCode,
    startDate,
    endDate
  );
  return rows.map((r) => r.id);
}

// 사진만 soft-delete. 트립은 보존 (사진 분실 ≠ 트립 분실).
// 의심 여행 reject 같은 흐름에서는 호출 측이 트립도 별도로 삭제할 수 있다.
export async function softDeletePhotosByIds(
  ids: string[]
): Promise<{ photosDeleted: number }> {
  if (ids.length === 0) return { photosDeleted: 0 };
  const db = await getTripDb();
  const now = Date.now();
  const placeholders = ids.map(() => "?").join(",");
  const r = await db.runAsync(
    `UPDATE visit_photos
        SET deleted_at = ?, updated_at = ?
      WHERE id IN (${placeholders})
        AND deleted_at IS NULL`,
    now,
    now,
    ...ids
  );
  return { photosDeleted: r.changes };
}
