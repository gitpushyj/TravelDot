import { toLocalDateKey } from "../../utils/date";
import {
  addPhotos,
  bridgeNearbyVisitDays,
  loadLatestVisitDate,
  PHOTO_LIMIT_PER_DAY,
  VisitPhotoInput,
} from "../travel/visitRepository";
import { useVisitStore, SyncReport } from "../travel/visitStore";
import { resolveCountryDetailed } from "./countryResolver";
import { reviewSuspectTrips } from "./deviceVerification";
import { ensurePermission, iteratePhotos } from "./photoLibrary";

// sinceDate가 주어지면 그 날짜(YYYY-MM-DD) 미만의 사진은 건너뛴다.
// iteratePhotos는 creationTime DESC로 사진을 내려주므로, 임계 날짜보다
// 이전 사진을 만나는 순간 더 이상 볼 필요가 없어 즉시 break한다.
async function runSync(sinceDate: string | null): Promise<void> {
  const store = useVisitStore.getState();
  const homeCode = store.homeCountry?.code ?? null;

  // 첫 스캔 여부를 사진 추가 *전에* 평가한다 — 사진 추가 후에는 트립이
  // 만들어져 더 이상 "첫 스캔"이 아니게 되기 때문. 이후 incremental sync나
  // Settings의 전체 재스캔에서는 사용자의 수동 분리/병합 결정을 보존하기 위해
  // 자동 병합을 실행하지 않는다.
  const isFirstScan = (await loadLatestVisitDate()) == null;

  const permission = await ensurePermission();
  if (permission === "denied") {
    store.setLastSync({
      permission,
      scanned: 0,
      withGps: 0,
      resolved: 0,
      added: 0,
    });
    return;
  }

  store.setSyncStatus({ running: true, processed: 0, phase: "scanning" });

  // (country|date) → DB 한도(PHOTO_LIMIT_PER_DAY)와 동일한 장수만 후보로 모은다.
  const buffer = new Map<string, VisitPhotoInput[]>();
  let scanned = 0;
  let withGps = 0;
  let resolved = 0;
  let sample: SyncReport["sample"] | undefined;

  try {
    for await (const p of iteratePhotos()) {
      const date = toLocalDateKey(p.takenAt);
      if (sinceDate && date < sinceDate) break;
      scanned += 1;
      if (scanned % 50 === 0) {
        useVisitStore
          .getState()
          .setSyncStatus({
            running: true,
            processed: scanned,
            phase: "scanning",
          });
      }
      if (p.lat == null || p.lng == null) continue;
      withGps += 1;
      const { code, diag } = resolveCountryDetailed(p.lat, p.lng);
      if (!sample) {
        sample = {
          lat: p.lat,
          lng: p.lng,
          code,
          bboxHits: diag.bboxHits,
          totalFeatures: diag.totalFeatures,
        };
      }
      if (!code) continue;
      // 본국은 자동 추가에서 제외한다. 본국 사진은 사용자가 "여행 추가" 메뉴를
      // 통해 원하는 날짜만 직접 선택하도록 한다.
      if (homeCode && code === homeCode) continue;
      resolved += 1;
      const key = `${code}|${date}`;
      const list = buffer.get(key) ?? [];
      if (list.length >= PHOTO_LIMIT_PER_DAY) continue;
      list.push({
        id: p.id,
        countryCode: code,
        date,
        localUri: p.uri,
        source: "auto",
        takenAt: p.takenAt,
      });
      buffer.set(key, list);
    }

    useVisitStore
      .getState()
      .setSyncStatus({ running: true, processed: scanned, phase: "saving" });

    const all: VisitPhotoInput[] = [];
    for (const items of buffer.values()) all.push(...items);
    const added = await addPhotos(all);

    // 첫 스캔이면 인접한 trip을 자동으로 묶는다 (gap ≤ 3일 한정).
    // 이후 스캔에서는 사용자의 수동 결정을 보존하기 위해 실행하지 않는다.
    if (isFirstScan) {
      await bridgeNearbyVisitDays(3);
    }

    await useVisitStore.getState().refreshVisits();

    // 사진 추가가 끝났다면 곧바로 디바이스 검증을 돌려 의심 여행을 추려둔다.
    // 본국이 없으면(온보딩 직전 등) 검증을 건너뛴다.
    if (homeCode) {
      useVisitStore
        .getState()
        .setSyncStatus({
          running: true,
          processed: scanned,
          phase: "verifying",
        });
      try {
        const suspects = await reviewSuspectTrips({ homeCode });
        useVisitStore.getState().setSuspectTrips(suspects);
      } catch {
        // 검증 실패는 sync 자체를 실패로 만들지 않는다.
      }
    }

    useVisitStore
      .getState()
      .setSyncStatus({ running: false, processed: scanned });
    useVisitStore
      .getState()
      .setLastSync({ permission, scanned, withGps, resolved, added, sample });
  } catch (err) {
    useVisitStore
      .getState()
      .setSyncStatus({ running: false, processed: scanned });
    useVisitStore.getState().setLastSync({
      permission,
      scanned,
      withGps,
      resolved,
      added: 0,
      sample,
      error: String(err),
    });
    throw err;
  }
}

export async function runFullSync(): Promise<void> {
  return runSync(null);
}

// 앱에 기록된 가장 최근 방문 날짜 이후의 사진만 추가 스캔한다.
// 기록이 전혀 없으면 전체 스캔으로 폴백한다.
export async function runIncrementalSync(): Promise<void> {
  const since = await loadLatestVisitDate();
  return runSync(since);
}
