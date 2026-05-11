import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ActiveFlight } from "./flightTypes";

const ACTIVE_KEY = "flight.active.v1";

export async function loadActiveFlight(): Promise<ActiveFlight | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ActiveFlight;
    // 형태 안전성 가벼운 체크. 손상된 레코드는 무시.
    if (
      typeof parsed?.id === "string" &&
      typeof parsed.departAt === "number" &&
      typeof parsed.arriveAt === "number" &&
      parsed.origin?.iata &&
      parsed.destination?.iata
    ) {
      return parsed;
    }
  } catch {
    // 손상된 JSON은 비행 없음으로 처리.
  }
  return null;
}

export async function saveActiveFlight(active: ActiveFlight | null): Promise<void> {
  if (active == null) {
    await AsyncStorage.removeItem(ACTIVE_KEY);
    return;
  }
  await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
}
