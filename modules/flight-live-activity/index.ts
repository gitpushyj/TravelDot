import { requireNativeModule } from "expo-modules-core";

export type FlightActivityAttrs = {
  originName: string;
  originIata: string;
  destName: string;
  destIata: string;
  departAt: number; // ms epoch
  arriveAt: number; // ms epoch
};

export type FlightLiveActivityNativeModule = {
  isSupported(): boolean;
  start(attrs: FlightActivityAttrs): Promise<void>;
  end(): Promise<void>;
};

// 모듈이 빠진 빌드(예: 안드로이드/Expo Go)에서 import만으로 크래시하지 않도록
// 첫 호출까지 requireNativeModule 평가를 미룬다.
let cached: FlightLiveActivityNativeModule | null = null;

export function getNativeModule(): FlightLiveActivityNativeModule | null {
  if (!cached) {
    try {
      cached = requireNativeModule<FlightLiveActivityNativeModule>("FlightLiveActivity");
    } catch {
      return null;
    }
  }
  return cached;
}
