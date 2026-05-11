import { create } from "zustand";

import type { AirportRef, ActiveFlight } from "./flightTypes";
import { loadActiveFlight, saveActiveFlight } from "./flightStorage";

type State = {
  active: ActiveFlight | null;
  hydrated: boolean;
  // 직전에 막 도착 처리된 비행. 도착 토스트를 한 번 띄우는 데 사용한다.
  // 토스트를 표시한 컴포넌트가 consumeArrived()로 비워 줘야 한다.
  arrived: ActiveFlight | null;

  hydrate: () => Promise<void>;
  start: (
    origin: AirportRef,
    destination: AirportRef,
    departAt: number,
    arriveAt: number
  ) => Promise<void>;
  cancel: () => Promise<void>;
  // 현재 시각 기준으로 도착했는지 검사해, 도착했다면 arrived로 옮기고 active를 null로.
  // 진입 직후·앱 foreground 복귀·주기 tick에서 호출한다.
  checkArrival: (now?: number) => Promise<void>;
  consumeArrived: () => void;
};

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useFlightStore = create<State>((set, get) => ({
  active: null,
  hydrated: false,
  arrived: null,

  hydrate: async () => {
    const loaded = await loadActiveFlight();
    if (loaded && Date.now() >= loaded.arriveAt) {
      // 앱이 닫혀 있는 동안 비행이 끝났다 — 도착 토스트는 한 번 띄워준다.
      await saveActiveFlight(null);
      set({ active: null, arrived: loaded, hydrated: true });
      return;
    }
    set({ active: loaded, hydrated: true });
  },

  start: async (origin, destination, departAt, arriveAt) => {
    const flight: ActiveFlight = {
      id: newId(),
      origin,
      destination,
      departAt,
      arriveAt,
    };
    // set을 먼저, persist를 그 다음. storage I/O가 늦거나 실패해도 화면에는 즉시
    // 비행이 active로 반영되도록 한다. 영속화 실패는 앱 재시작 시 복원만 못할 뿐
    // 현재 세션의 비행 동작에는 영향이 없다.
    set({ active: flight, arrived: null });
    try {
      await saveActiveFlight(flight);
    } catch (e) {
      if (__DEV__) console.warn("[flight] persist failed:", e);
    }
  },

  cancel: async () => {
    await saveActiveFlight(null);
    set({ active: null });
  },

  checkArrival: async (now = Date.now()) => {
    const a = get().active;
    if (!a) return;
    if (now < a.arriveAt) return;
    await saveActiveFlight(null);
    set({ active: null, arrived: a });
  },

  consumeArrived: () => set({ arrived: null }),
}));
