import * as MediaLibrary from "expo-media-library";

import { resolveCountry } from "./countryResolver";
import { iteratePhotos } from "./photoLibrary";
import {
  loadAllPhotosForReview,
  updatePhotoDevices,
  VisitPhotoForReview,
} from "../travel/visitRepository";

// 본국 사진 샘플 — 너무 많으면 시간이 오래 걸리므로 80장 정도로 제한.
// 평범한 사용자라면 본국에서만 찍은 사진이 압도적이라 80장 표본이면 충분.
const OWN_DEVICE_SAMPLE_LIMIT = 80;
// 본국 사진 중 N장 이상 등장한 (make, model)을 "내 기기"로 인정.
// 자주 들고 다니는 동행자(가족) 기기는 자연스럽게 함께 등록되며,
// 한두 번만 받은 친구 사진은 임계 미달로 걸러진다.
const OWN_DEVICE_MIN_COUNT = 5;
// 사용자가 친구한테 받은 사진 날짜가 본인 여행 ±N일이면 같은 여행으로 흡수.
const GRACE_PERIOD_DAYS = 1;

export type SuspectTrip = {
  countryCode: string;
  startDate: string;
  endDate: string;
  days: number;
  photoIds: string[];
  photoCount: number;
  // 친구 기기 짐작용 라벨 (자주 등장한 순)
  deviceLabels: string[];
};

export function deviceKey(
  make: string | null | undefined,
  model: string | null | undefined
): string {
  return `${(make ?? "").trim().toLowerCase()}|${(model ?? "").trim().toLowerCase()}`;
}

export function deviceLabel(
  make: string | null | undefined,
  model: string | null | undefined
): string {
  const m = (make ?? "").trim();
  const md = (model ?? "").trim();
  if (m && md) return `${m} ${md}`;
  return md || m || "알 수 없는 기기";
}

// expo-media-library의 exif는 플랫폼/버전에 따라 평면화 또는 {TIFF} 서브딕트로
// 들어올 수 있어 양쪽을 모두 시도한다.
function readMakeModel(exif: unknown): {
  make: string | null;
  model: string | null;
} {
  if (!exif || typeof exif !== "object") return { make: null, model: null };
  const e = exif as Record<string, unknown>;
  const tiff = (e["{TIFF}"] ?? e.TIFF) as Record<string, unknown> | undefined;
  const pickStr = (...candidates: unknown[]): string | null => {
    for (const c of candidates) {
      if (typeof c === "string" && c.trim() !== "") return c.trim();
    }
    return null;
  };
  return {
    make: pickStr(e.Make, tiff?.Make),
    model: pickStr(e.Model, tiff?.Model),
  };
}

async function fetchDeviceForAsset(
  id: string
): Promise<{ make: string | null; model: string | null } | null> {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(id, {
      shouldDownloadFromNetwork: false,
    });
    return readMakeModel((info as { exif?: unknown }).exif);
  } catch {
    return null;
  }
}

// 본국 사진 표본을 훑어 빈도가 높은 (make, model)을 "내 기기"로 본다.
export async function detectOwnDevices(
  homeCode: string
): Promise<Set<string>> {
  const counts = new Map<string, number>();
  let sampled = 0;

  for await (const p of iteratePhotos()) {
    if (sampled >= OWN_DEVICE_SAMPLE_LIMIT) break;
    if (p.lat == null || p.lng == null) continue;
    const code = resolveCountry(p.lat, p.lng);
    if (code !== homeCode) continue;
    const dev = await fetchDeviceForAsset(p.id);
    if (!dev || (!dev.make && !dev.model)) continue;
    const k = deviceKey(dev.make, dev.model);
    counts.set(k, (counts.get(k) ?? 0) + 1);
    sampled += 1;
  }

  const result = new Set<string>();
  for (const [k, n] of counts) {
    if (n >= OWN_DEVICE_MIN_COUNT) result.add(k);
  }
  // 표본이 적어 임계 미달이면 최소 1개라도 반영해서 false positive를 줄인다.
  if (result.size === 0 && counts.size > 0) {
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    result.add(top[0]);
  }
  return result;
}

// device_checked_at == null 인 사진들의 make/model을 채워 넣는다. iOS의
// getAssetInfoAsync는 한 장당 수십 ms가 들기 때문에 작은 배치로 동시 처리한다.
const DEVICE_INFO_CONCURRENCY = 16;

export async function fillMissingDeviceInfo(
  photos: VisitPhotoForReview[],
  onProgress?: (done: number, total: number) => void
): Promise<VisitPhotoForReview[]> {
  const todo = photos.filter((p) => p.deviceCheckedAt == null);
  if (todo.length === 0) return photos;
  const updates: { id: string; make: string | null; model: string | null }[] =
    [];
  for (let i = 0; i < todo.length; i += DEVICE_INFO_CONCURRENCY) {
    const batch = todo.slice(i, i + DEVICE_INFO_CONCURRENCY);
    const results = await Promise.all(
      batch.map((p) => fetchDeviceForAsset(p.id))
    );
    for (let j = 0; j < batch.length; j++) {
      const dev = results[j];
      updates.push({
        id: batch[j].id,
        make: dev?.make ?? null,
        model: dev?.model ?? null,
      });
    }
    if (onProgress) onProgress(updates.length, todo.length);
  }
  await updatePhotoDevices(updates);
  const byId = new Map(updates.map((u) => [u.id, u]));
  const now = Date.now();
  return photos.map((p) => {
    const u = byId.get(p.id);
    if (!u) return p;
    return {
      ...p,
      deviceMake: u.make,
      deviceModel: u.model,
      deviceCheckedAt: now,
    };
  });
}

// 분류 후 의심 여행을 그룹핑한다. 본인 사진/미확인 사진은 안전, 외부 사진만
// ±GRACE_PERIOD_DAYS 내에 본인 사진이 같은 국가에 없을 때 의심으로 잡힌다.
export function buildSuspectTrips(
  photos: VisitPhotoForReview[],
  ownDevices: Set<string>
): SuspectTrip[] {
  type Cls = "own" | "foreign" | "unknown";
  const classify = (p: VisitPhotoForReview): Cls => {
    if (p.deviceMake == null && p.deviceModel == null) return "unknown";
    return ownDevices.has(deviceKey(p.deviceMake, p.deviceModel))
      ? "own"
      : "foreign";
  };

  const byCountry = new Map<string, VisitPhotoForReview[]>();
  for (const p of photos) {
    const arr = byCountry.get(p.countryCode) ?? [];
    arr.push(p);
    byCountry.set(p.countryCode, arr);
  }

  const suspects: SuspectTrip[] = [];

  for (const [country, list] of byCountry) {
    list.sort((a, b) => a.takenAt - b.takenAt);
    const ownDates = new Set<string>();
    for (const p of list) {
      if (classify(p) === "own") ownDates.add(p.date);
    }
    const hasOwnNeighbor = (date: string): boolean => {
      const d = parseDate(date);
      for (let off = -GRACE_PERIOD_DAYS; off <= GRACE_PERIOD_DAYS; off++) {
        if (ownDates.has(formatDate(addDays(d, off)))) return true;
      }
      return false;
    };

    const suspectsInCountry: VisitPhotoForReview[] = [];
    for (const p of list) {
      if (classify(p) !== "foreign") continue;
      if (hasOwnNeighbor(p.date)) continue;
      suspectsInCountry.push(p);
    }
    if (suspectsInCountry.length === 0) continue;

    // 연속 날짜 묶음으로 분리. gap이 (GRACE_PERIOD_DAYS + 1) 이하면 같은 묶음.
    suspectsInCountry.sort((a, b) => a.takenAt - b.takenAt);
    let group: VisitPhotoForReview[] = [];
    const groups: VisitPhotoForReview[][] = [];
    let lastDate: string | null = null;
    for (const p of suspectsInCountry) {
      if (lastDate != null && daysBetween(lastDate, p.date) > GRACE_PERIOD_DAYS + 1) {
        groups.push(group);
        group = [];
      }
      group.push(p);
      lastDate = p.date;
    }
    if (group.length > 0) groups.push(group);

    for (const g of groups) {
      const dates = [...new Set(g.map((p) => p.date))].sort();
      const start = dates[0];
      const end = dates[dates.length - 1];
      const labelCounts = new Map<string, number>();
      for (const p of g) {
        const lab = deviceLabel(p.deviceMake, p.deviceModel);
        labelCounts.set(lab, (labelCounts.get(lab) ?? 0) + 1);
      }
      suspects.push({
        countryCode: country,
        startDate: start,
        endDate: end,
        days: daysBetween(start, end) + 1,
        photoIds: g.map((p) => p.id),
        photoCount: g.length,
        deviceLabels: [...labelCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([k]) => k),
      });
    }
  }

  suspects.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  return suspects;
}

// 최상위 진입점: 본국에서 내 기기 셋을 추정 → 미검증 사진의 make/model을 채움 →
// 의심 여행 묶음 반환.
export async function reviewSuspectTrips(opts: {
  homeCode: string;
  onProgress?: (done: number, total: number) => void;
}): Promise<SuspectTrip[]> {
  const ownDevices = await detectOwnDevices(opts.homeCode);
  // 본국 사진에서 내 기기를 단 하나도 찾지 못한 경우(신규 사용자, 본국 사진이 모두
  // 메타 없이 저장된 경우 등). 모든 외국 사진을 "다른 기기"로 간주하면 false positive가
  // 폭주하므로 안전하게 빈 결과를 반환한다.
  if (ownDevices.size === 0) return [];
  let photos = await loadAllPhotosForReview();
  photos = await fillMissingDeviceInfo(photos, opts.onProgress);
  return buildSuspectTrips(photos, ownDevices);
}

function parseDate(s: string): Date {
  return new Date(
    Number(s.slice(0, 4)),
    Number(s.slice(5, 7)) - 1,
    Number(s.slice(8, 10))
  );
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function daysBetween(a: string, b: string): number {
  const da = parseDate(a).getTime();
  const db = parseDate(b).getTime();
  return Math.round((db - da) / 86400000);
}
