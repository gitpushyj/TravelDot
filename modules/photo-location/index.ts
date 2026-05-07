import { requireNativeModule } from "expo-modules-core";

export type AssetLocation = {
  id: string;
  lat: number | null;
  lng: number | null;
};

type NativeModule = {
  getLocations(ids: string[]): Promise<AssetLocation[]>;
};

// PhotoLocation 네이티브 모듈은 iOS에만 등록돼 있다. Android에서 이 모듈을 import만
// 해도 즉시 requireNativeModule이 평가되며 "Cannot find native module" 에러가 떠
// 빨간 화면이 뜨므로, 실제 호출 시점까지 평가를 미룬다.
let cached: NativeModule | null = null;
function native(): NativeModule {
  if (!cached) cached = requireNativeModule<NativeModule>("PhotoLocation");
  return cached;
}

export async function getLocations(ids: string[]): Promise<AssetLocation[]> {
  if (ids.length === 0) return [];
  return native().getLocations(ids);
}
