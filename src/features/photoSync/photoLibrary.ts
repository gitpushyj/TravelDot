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

// 세션 내 resolve 결과 캐시. 같은 자산을 여러 화면(미리보기, grid, image
// detail)에서 다시 표시할 때 native 왕복을 0회로 줄인다. file://만 캐시한다 —
// ph://가 그대로 나온 경우(삭제됨/iCloud 미다운로드)는 다음에 재시도해야 하므로
// 캐시하지 않는다.
const resolvedUriCache = new Map<string, string>();

// iOS의 ph:// URI는 일부 RN Image 로더 빌드가 인식하지 못해 "no suitable image
// URL loader found for ph://" 에러를 낸다. 표시 직전에 MediaLibrary로 file://
// localUri를 해석한다. 이미 file://(Android 등)인 URI는 그대로 통과시킨다.
//
// shouldDownloadFromNetwork: true로 호출하면 iCloud-only 자산도 네트워크에서
// 받아와 localUri를 채운다. 호출 측에서 다운로드 비용을 감수할 가치가 있을 때만
// 켠다(예: 사용자가 곧장 보게 될 미리보기). 기본값(false)은 디바이스에 캐시된
// 자산만 해석해 빠르고 데이터 사용이 없다.
export async function resolveDisplayUris(
  entries: { id: string; uri: string }[],
  options?: { shouldDownloadFromNetwork?: boolean }
): Promise<Record<string, string>> {
  const shouldDownloadFromNetwork =
    options?.shouldDownloadFromNetwork ?? false;
  const out: Record<string, string> = {};
  await Promise.all(
    entries.map(async ({ id, uri }) => {
      if (!uri.startsWith("ph://")) {
        out[id] = uri;
        return;
      }
      const cached = resolvedUriCache.get(id);
      if (cached) {
        out[id] = cached;
        return;
      }
      try {
        const info = await MediaLibrary.getAssetInfoAsync(id, {
          shouldDownloadFromNetwork,
        });
        const local = info.localUri ?? info.uri;
        if (local) {
          out[id] = local;
          if (!local.startsWith("ph://")) {
            resolvedUriCache.set(id, local);
          }
        }
      } catch {
        // 자산이 삭제됐거나 권한이 바뀐 경우는 표시에서 빠진다.
      }
    })
  );
  return out;
}

export async function* iteratePhotos(
  pageSize = 200,
  options?: {
    createdAfter?: number;
    createdBefore?: number;
    // 첫 페이지에서 받은 라이브러리 총 사진 수를 한 번 알려준다. 진행률 UI에서
    // phaseTotal로 사용한다. createdAfter/before 필터를 쓰면 필터된 값이라
    // 정확하지 않을 수 있다 (현재 호출은 모두 필터 없이 들어옴).
    onTotal?: (totalCount: number) => void;
  }
): AsyncGenerator<PhotoMeta, void, void> {
  let after: string | undefined;
  let isFirstPage = true;
  while (true) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: pageSize,
      after,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      createdAfter: options?.createdAfter,
      createdBefore: options?.createdBefore,
    });
    if (isFirstPage) {
      isFirstPage = false;
      options?.onTotal?.(page.totalCount);
    }

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
      // 페이지가 큰 경우(예: sync에서 2000장) 페이지 안쪽 처리만으로도 본
      // 스레드를 수백 ms 단위로 블록할 수 있다. 256장마다 한 번 macrotask로
      // 양보해 UI/애니메이션이 끊기지 않게 한다. 256보다 작은 페이지에서는
      // 이 분기가 한 번도 안 걸려 비용이 0.
      if ((i & 0xff) === 0xff) {
        await new Promise<void>((resolve) => setImmediate(resolve));
      }
    }

    if (!page.hasNextPage) return;
    after = page.endCursor;
    // 페이지 사이에도 한 번 양보. 페이지 내부 yield와 합쳐 큰 페이지에서도
    // UI freeze가 안 생기도록 한다.
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}
