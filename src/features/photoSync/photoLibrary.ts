import * as MediaLibrary from "expo-media-library";

import { getLocations } from "../../../modules/photo-location";

export type PhotoMeta = {
  id: string;
  uri: string;
  // null이면 GPS 메타데이터가 사진에 없거나 권한 범위 밖이라는 뜻.
  lat: number | null;
  lng: number | null;
  takenAt: number;
};

function toFiniteNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// iOS의 "선택된 사진만" 권한도 스캔에 충분하므로 limited를 허용한다.
export async function ensurePermission(): Promise<
  "granted" | "limited" | "denied"
> {
  const res = await MediaLibrary.requestPermissionsAsync();
  if (res.status === "granted") {
    return res.accessPrivileges === "limited" ? "limited" : "granted";
  }
  return "denied";
}

// iOS의 ph:// URI는 일부 RN Image 로더 빌드가 인식하지 못해 "no suitable image
// URL loader found for ph://" 에러를 낸다. 표시 직전에 MediaLibrary로 file://
// localUri를 해석한다. 이미 file://(Android 등)인 URI는 그대로 통과시킨다.
export async function resolveDisplayUris(
  entries: { id: string; uri: string }[]
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    entries.map(async ({ id, uri }) => {
      if (!uri.startsWith("ph://")) {
        out[id] = uri;
        return;
      }
      try {
        const info = await MediaLibrary.getAssetInfoAsync(id, {
          shouldDownloadFromNetwork: false,
        });
        const local = info.localUri ?? info.uri;
        if (local) out[id] = local;
      } catch {
        // 자산이 삭제됐거나 권한이 바뀐 경우는 표시에서 빠진다.
      }
    })
  );
  return out;
}

export async function* iteratePhotos(
  pageSize = 200,
  options?: { createdAfter?: number; createdBefore?: number }
): AsyncGenerator<PhotoMeta, void, void> {
  let after: string | undefined;
  while (true) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: pageSize,
      after,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      createdAfter: options?.createdAfter,
      createdBefore: options?.createdBefore,
    });

    // iOS는 PHAsset.location, Android는 EXIF 헤더를 네이티브에서 한 번에 읽는다.
    // expo-media-library의 getAssetInfoAsync(파일을 열어 EXIF까지 파싱)를 우회해
    // 사진 한 장당 비용을 마이크로~수 ms 수준으로 낮춘다.
    const ids = page.assets.map((a) => a.id);
    const locations = await getLocations(ids);
    for (let i = 0; i < page.assets.length; i++) {
      const asset = page.assets[i];
      const loc = locations[i];
      yield {
        id: asset.id,
        // 스캔 단계에서는 ph:// URI를 그대로 흘려 getAssetInfoAsync 비용을
        // 0으로 줄인다. ph://는 RN Image 로더가 케이스(iCloud 미다운로드 자산
        // 등)에 따라 실패하므로 표시 시점에 resolveDisplayUris로 해석해야 한다.
        uri: asset.uri,
        lat: toFiniteNumber(loc?.lat),
        lng: toFiniteNumber(loc?.lng),
        takenAt: asset.creationTime,
      };
    }

    if (!page.hasNextPage) return;
    after = page.endCursor;
  }
}
