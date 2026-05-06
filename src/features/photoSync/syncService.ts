import { toLocalDateKey } from "../../utils/date";
import { addPhotos, VisitPhotoInput } from "../travel/visitRepository";
import { useVisitStore } from "../travel/visitStore";
import { resolveCountry } from "./countryResolver";
import { ensurePermission, iteratePhotos } from "./photoLibrary";

export async function runFullSync(): Promise<{ added: number; scanned: number }> {
  const ok = await ensurePermission();
  if (!ok) return { added: 0, scanned: 0 };

  const store = useVisitStore.getState();
  store.setSyncStatus({ running: true, processed: 0 });

  // (country|date) → up to 3 photos. We cap during the scan so a single
  // country/day with thousands of photos doesn't bloat memory.
  const buffer = new Map<string, VisitPhotoInput[]>();
  let scanned = 0;
  try {
    for await (const p of iteratePhotos()) {
      scanned += 1;
      if (scanned % 50 === 0) {
        useVisitStore
          .getState()
          .setSyncStatus({ running: true, processed: scanned });
      }
      const code = resolveCountry(p.lat, p.lng);
      if (!code) continue;
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
    useVisitStore.getState().setSyncStatus({ running: false, processed: scanned });
    return { added, scanned };
  } catch (err) {
    useVisitStore.getState().setSyncStatus({ running: false, processed: scanned });
    throw err;
  }
}
