import { Platform } from "react-native";
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

// iOS에서 expo-media-library의 getAssetInfoAsync가 파일을 열어 EXIF까지 읽는 탓에
// 사진 한 장당 수십~수백 ms가 든다. 우리는 GPS 좌표만 필요하므로 PHAsset.location을
// 직접 읽는 native 모듈(modules/photo-location)을 통해 우회한다.
// Android(향후 지원 시)는 동일 인터페이스가 없어 기존 경로로 폴백.
const ASSET_INFO_CONCURRENCY = 20;

async function loadPhotoMetaViaInfo(
  asset: MediaLibrary.Asset
): Promise<PhotoMeta> {
  const info = await MediaLibrary.getAssetInfoAsync(asset, {
    shouldDownloadFromNetwork: false,
  });
  const loc = info.location ?? null;
  const lat = toFiniteNumber(loc?.latitude);
  const lng = toFiniteNumber(loc?.longitude);
  return {
    id: asset.id,
    uri: info.localUri ?? asset.uri,
    lat,
    lng,
    takenAt: asset.creationTime,
  };
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

    if (Platform.OS === "ios") {
      const ids = page.assets.map((a) => a.id);
      const locations = await getLocations(ids);
      for (let i = 0; i < page.assets.length; i++) {
        const asset = page.assets[i];
        const loc = locations[i];
        yield {
          id: asset.id,
          // ph:// URI로도 Image 컴포넌트가 정상 로드한다. localUri 해석을
          // 생략해 getAssetInfoAsync 호출을 0으로 줄인다.
          uri: asset.uri,
          lat: toFiniteNumber(loc?.lat),
          lng: toFiniteNumber(loc?.lng),
          takenAt: asset.creationTime,
        };
      }
    } else {
      for (let i = 0; i < page.assets.length; i += ASSET_INFO_CONCURRENCY) {
        const batch = page.assets.slice(i, i + ASSET_INFO_CONCURRENCY);
        const metas = await Promise.all(batch.map(loadPhotoMetaViaInfo));
        for (const meta of metas) yield meta;
      }
    }

    if (!page.hasNextPage) return;
    after = page.endCursor;
  }
}
