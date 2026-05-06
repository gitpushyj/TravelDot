import { toLocalDateKey } from "../../utils/date";
import {
  addPhotos,
  loadLatestVisitDate,
  VisitPhotoInput,
} from "../travel/visitRepository";
import { useVisitStore, SyncReport } from "../travel/visitStore";
import { resolveCountryDetailed } from "./countryResolver";
import { ensurePermission, iteratePhotos } from "./photoLibrary";

// sinceDate가 주어지면 그 날짜(YYYY-MM-DD) 미만의 사진은 건너뛴다.
// iteratePhotos는 creationTime DESC로 사진을 내려주므로, 임계 날짜보다
// 이전 사진을 만나는 순간 더 이상 볼 필요가 없어 즉시 break한다.
async function runSync(sinceDate: string | null): Promise<void> {
  const store = useVisitStore.getState();
  const homeCode = store.homeCountry?.code ?? null;
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

  store.setSyncStatus({ running: true, processed: 0 });

  // (country|date) → up to 3 photos per (country, date).
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
          .setSyncStatus({ running: true, processed: scanned });
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
      if (list.length >= 3) continue;
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

    const all: VisitPhotoInput[] = [];
    for (const items of buffer.values()) all.push(...items);
    const added = await addPhotos(all);
    await useVisitStore.getState().refreshVisits();
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
