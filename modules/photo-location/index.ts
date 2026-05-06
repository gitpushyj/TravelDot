import { requireNativeModule } from "expo-modules-core";

export type AssetLocation = {
  id: string;
  lat: number | null;
  lng: number | null;
};

type NativeModule = {
  getLocations(ids: string[]): Promise<AssetLocation[]>;
};

const PhotoLocation = requireNativeModule<NativeModule>("PhotoLocation");

export async function getLocations(ids: string[]): Promise<AssetLocation[]> {
  if (ids.length === 0) return [];
  return PhotoLocation.getLocations(ids);
}
