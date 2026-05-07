import { getDb } from "../db";
import { countPhotosForDay } from "./counts";
import { ensureVisitDay } from "./internal";
import {
  PHOTO_LIMIT_PER_DAY,
  type TripPhoto,
  type VisitPhotoForReview,
  type VisitPhotoInput,
} from "./types";

// (country, date) 그룹별로 PHOTO_LIMIT_PER_DAY 제한을 강제하면서 일괄 INSERT한다.
export async function addPhotos(inputs: VisitPhotoInput[]): Promise<number> {
  if (inputs.length === 0) return 0;
  const db = await getDb();
  const now = Date.now();
  let inserted = 0;
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
      const existing = await countPhotosForDay(countryCode, date);
      const slots = Math.max(0, PHOTO_LIMIT_PER_DAY - existing);
      const toInsert = items.slice(0, slots);
      if (toInsert.length === 0) continue;
      await ensureVisitDay(countryCode, date, now);
      for (const ph of toInsert) {
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
        if (r.changes > 0) inserted += 1;
      }
    }
  });
  return inserted;
}

export async function loadPhotosForTrip(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<TripPhoto[]> {
  const db = await getDb();
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

// 디바이스 검증용으로 모든 visit_photo를 가볍게 가져온다.
// 사용자가 한 번 "내 여행 맞음"으로 확인한 사진(user_reviewed_at != null)은
// 의심 후보에서 영구 제외하기 위해 여기서 미리 걸러낸다.
export async function loadAllPhotosForReview(): Promise<VisitPhotoForReview[]> {
  const db = await getDb();
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

// 의심 여행 미리보기용 — id 묶음에 해당하는 visit_photos의 localUri를 반환.
// soft-delete된 행은 제외하고, local_uri가 비어있는 행은 결과에서 빠진다.
export async function loadPhotoUrisByIds(
  ids: string[]
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const db = await getDb();
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

// 사용자가 "내 여행 맞음"으로 확인한 사진들을 표시. 다음 리뷰에서 제외된다.
export async function markPhotosUserReviewed(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const now = Date.now();
  // SQLite의 기본 파라미터 한도(999)를 넘지 않도록 분할 처리한다.
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

// 검증 결과(make/model)를 빈 사진들에 채워 넣는다.
export async function updatePhotoDevices(
  updates: { id: string; make: string | null; model: string | null }[]
): Promise<void> {
  if (updates.length === 0) return;
  const db = await getDb();
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

// "내 여행 아님"으로 거른 사진들을 일괄 soft-delete하고, 남은 사진/노트가 없는
// 날짜의 visit_days까지 정리한다.
export async function softDeletePhotosByIds(
  ids: string[]
): Promise<{ photosDeleted: number; daysDeleted: number }> {
  if (ids.length === 0) return { photosDeleted: 0, daysDeleted: 0 };
  const db = await getDb();
  const now = Date.now();
  let photosDeleted = 0;
  let daysDeleted = 0;
  await db.withTransactionAsync(async () => {
    // 영향받는 (country, date) 조합을 미리 모아둔다.
    const placeholders = ids.map(() => "?").join(",");
    const affected = await db.getAllAsync<{
      country_code: string;
      date: string;
    }>(
      `SELECT DISTINCT country_code, date FROM visit_photos
        WHERE id IN (${placeholders})`,
      ...ids
    );

    const r1 = await db.runAsync(
      `UPDATE visit_photos
          SET deleted_at = ?, updated_at = ?
        WHERE id IN (${placeholders})
          AND deleted_at IS NULL`,
      now,
      now,
      ...ids
    );
    photosDeleted = r1.changes;

    for (const a of affected) {
      const stillHasPhoto = await db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) AS n FROM visit_photos
          WHERE country_code = ? AND date = ? AND deleted_at IS NULL`,
        a.country_code,
        a.date
      );
      const stillHasNote = await db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) AS n FROM visit_notes
          WHERE country_code = ? AND date = ? AND deleted_at IS NULL`,
        a.country_code,
        a.date
      );
      if ((stillHasPhoto?.n ?? 0) === 0 && (stillHasNote?.n ?? 0) === 0) {
        const r2 = await db.runAsync(
          `UPDATE visit_days
              SET deleted_at = ?, updated_at = ?
            WHERE country_code = ? AND date = ? AND deleted_at IS NULL`,
          now,
          now,
          a.country_code,
          a.date
        );
        daysDeleted += r2.changes;
      }
    }
  });
  return { photosDeleted, daysDeleted };
}
