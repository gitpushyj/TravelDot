import { toLocalDateKey } from "../../utils/date";
import { addPhotos, VisitPhotoInput } from "../travel/visitRepository";
import { useVisitStore, SyncReport } from "../travel/visitStore";
import { resolveCountryDetailed } from "./countryResolver";
import { ensurePermission, iteratePhotos } from "./photoLibrary";

export async function runFullSync(): Promise<void> {
  const store = useVisitStore.getState();
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
      scanned += 1;
      if (scanned % 50 === 0) {
        useVisitStore
          .getState()
          .setSyncStatus({ running: true, processed: scanned });
      }
      if (p.lat == null || p.lng == null) continue;
      withGps += 1;
      // raw 값(p.lat, p.lng)을 그대로 resolveCountry에 흘리고, sample에도 그대로 저장.
      // 만약 iOS가 string을 줬다면 이 단계에서 그대로 string이 보일 것.
      const latNum =
        typeof p.lat === "number" ? p.lat : Number(p.lat as unknown);
      const lngNum =
        typeof p.lng === "number" ? p.lng : Number(p.lng as unknown);
      const { code, diag } = resolveCountryDetailed(latNum, lngNum);
      if (!sample) {
        sample = {
          lat: p.lat as number,
          lng: p.lng as number,
          code,
          bboxHits: diag.bboxHits,
          totalFeatures: diag.totalFeatures,
        };
      }
      if (!code) continue;
      resolved += 1;
      const date = toLocalDateKey(p.takenAt);
      const key = `${code}|${date}`;
      const list = buffer.get(key) ?? [];
      if (list.length >= 3) continue;
      list.push({
        id: p.id,
        countryCode: code,
        date,
        photoUri: p.uri,
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
