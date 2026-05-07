import { requireNativeModule } from "expo-modules-core";

export type AssetLocation = {
  id: string;
  lat: number | null;
  lng: number | null;
};

type NativeModule = {
  getLocations(ids: string[]): Promise<AssetLocation[]>;
};

// 첫 호출까지 requireNativeModule 평가를 미뤄, 모듈이 빠진 빌드에서 import만으로
// "Cannot find native module" 빨간 화면이 뜨지 않도록 한다.
let cached: NativeModule | null = null;
function native(): NativeModule {
  if (!cached) cached = requireNativeModule<NativeModule>("PhotoLocation");
  return cached;
}

export async function getLocations(ids: string[]): Promise<AssetLocation[]> {
  if (ids.length === 0) return [];
  return native().getLocations(ids);
}
