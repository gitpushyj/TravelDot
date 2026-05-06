import * as MediaLibrary from "expo-media-library";

export type PhotoMeta = {
  id: string;
  uri: string;
  lat: number;
  lng: number;
  takenAt: number;
};

export async function ensurePermission(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === "granted";
}

// Async-iterate every photo asset that has GPS metadata. Skips assets without
// location to avoid emitting partial records.
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
      const loc = info.location;
      if (!loc) continue;
      yield {
        id: asset.id,
        uri: info.localUri ?? asset.uri,
        lat: loc.latitude,
        lng: loc.longitude,
        takenAt: asset.creationTime,
      };
    }
    if (!page.hasNextPage) return;
    after = page.endCursor;
  }
}
