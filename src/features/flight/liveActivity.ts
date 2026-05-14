import { Platform } from "react-native";
import { requireNativeModule } from "expo-modules-core";

import type { ActiveFlight } from "./flightTypes";

type NativeModule = {
  isSupported(): boolean;
  start(attrs: {
    originName: string;
    originIata: string;
    destName: string;
    destIata: string;
    departAt: number;
    arriveAt: number;
  }): Promise<void>;
  end(): Promise<void>;
};

// 첫 호출까지 requireNativeModule 평가를 미뤄, 모듈이 빠진 빌드에서 import만으로
// 크래시하지 않도록 한다. iOS가 아니면 아예 네이티브를 건드리지 않는다.
let cached: NativeModule | null = null;
function native(): NativeModule | null {
  if (Platform.OS !== "ios") return null;
  if (!cached) {
    try {
      cached = requireNativeModule<NativeModule>("FlightLiveActivity");
    } catch {
      return null;
    }
  }
  return cached;
}

export async function startFlightActivity(f: ActiveFlight): Promise<void> {
  const m = native();
  if (!m) return;
  try {
    await m.start({
      originName: f.origin.name,
      originIata: f.origin.iata,
      destName: f.destination.name,
      destIata: f.destination.iata,
      departAt: f.departAt,
      arriveAt: f.arriveAt,
    });
  } catch (e) {
    // 라이브액티비티 실패는 비행 동작 자체에 영향이 없다 — 조용히 무시.
    if (__DEV__) console.warn("[liveActivity] start failed:", e);
  }
}

export async function endFlightActivity(): Promise<void> {
  const m = native();
  if (!m) return;
  try {
    await m.end();
  } catch (e) {
    if (__DEV__) console.warn("[liveActivity] end failed:", e);
  }
}
