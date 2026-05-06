import * as MediaLibrary from "expo-media-library";

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

export async function* iteratePhotos(
  pageSize = 200
): AsyncGenerator<PhotoMeta, void, void> {
  let after: string | undefined;
  while (true) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: pageSize,
      after,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    });
    for (const asset of page.assets) {
      const info = await MediaLibrary.getAssetInfoAsync(asset, {
        shouldDownloadFromNetwork: false,
      });
      const loc = info.location ?? null;
      // iOS는 latitude/longitude를 string으로 보낼 때가 있다(관찰됨).
      // 비교 연산자가 문자열 비교로 새어나가지 않도록 여기서 number로 정규화.
      const lat = toFiniteNumber(loc?.latitude);
      const lng = toFiniteNumber(loc?.longitude);
      yield {
        id: asset.id,
        uri: info.localUri ?? asset.uri,
        lat,
        lng,
        takenAt: asset.creationTime,
      };
    }
    if (!page.hasNextPage) return;
    after = page.endCursor;
  }
}
