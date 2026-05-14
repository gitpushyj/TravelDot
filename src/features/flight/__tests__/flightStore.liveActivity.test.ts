import type { ActiveFlight } from "../flightTypes";

// __DEV__는 RN 런타임 글로벌이라 jest(node) 환경엔 없다. flightStore가 참조하므로 정의.
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const ICN = { iata: "ICN", name: "Incheon Intl", city: "Seoul", country: "KR", lat: 37.46, lng: 126.44 };
const NRT = { iata: "NRT", name: "Narita Intl", city: "Tokyo", country: "JP", lat: 35.76, lng: 140.38 };

// jest.mock 팩토리는 `mock` 접두사 변수만 참조할 수 있어 이름을 그렇게 둔다.
const mockStartFlightActivity = jest.fn().mockResolvedValue(undefined);
const mockEndFlightActivity = jest.fn().mockResolvedValue(undefined);
const mockSaveActiveFlight = jest.fn().mockResolvedValue(undefined);
let mockLoaded: ActiveFlight | null = null;

jest.mock("../liveActivity", () => ({
  startFlightActivity: (...a: unknown[]) => mockStartFlightActivity(...a),
  endFlightActivity: (...a: unknown[]) => mockEndFlightActivity(...a),
}));
jest.mock("../flightStorage", () => ({
  loadActiveFlight: () => Promise.resolve(mockLoaded),
  saveActiveFlight: (...a: unknown[]) => mockSaveActiveFlight(...a),
}));
jest.mock("../../../lib/tracking", () => ({ track: jest.fn() }));

function freshStore() {
  jest.resetModules();
  return require("../flightStore").useFlightStore;
}

describe("flightStore × liveActivity", () => {
  beforeEach(() => {
    mockStartFlightActivity.mockClear();
    mockEndFlightActivity.mockClear();
    mockSaveActiveFlight.mockClear();
    mockLoaded = null;
  });

  it("start()는 라이브액티비티를 시작한다", async () => {
    const useFlightStore = freshStore();
    await useFlightStore.getState().start(ICN, NRT, 1000, 9000);
    expect(mockStartFlightActivity).toHaveBeenCalledTimes(1);
    expect(mockStartFlightActivity.mock.calls[0][0]).toMatchObject({ origin: ICN, destination: NRT });
  });

  it("cancel()은 라이브액티비티를 종료한다", async () => {
    const useFlightStore = freshStore();
    await useFlightStore.getState().start(ICN, NRT, 1000, Date.now() + 60_000);
    await useFlightStore.getState().cancel();
    expect(mockEndFlightActivity).toHaveBeenCalledTimes(1);
  });

  it("checkArrival()이 도착을 감지하면 라이브액티비티를 종료한다", async () => {
    const useFlightStore = freshStore();
    const past = Date.now() - 1000;
    await useFlightStore.getState().start(ICN, NRT, past - 60_000, past);
    mockEndFlightActivity.mockClear();
    await useFlightStore.getState().checkArrival();
    expect(mockEndFlightActivity).toHaveBeenCalledTimes(1);
  });

  it("hydrate()에서 진행 중 비행이 있으면 라이브액티비티를 재동기화한다", async () => {
    mockLoaded = {
      id: "x", origin: ICN, destination: NRT,
      departAt: Date.now() - 1000, arriveAt: Date.now() + 60_000,
    };
    const useFlightStore = freshStore();
    await useFlightStore.getState().hydrate();
    expect(mockStartFlightActivity).toHaveBeenCalledTimes(1);
    expect(mockEndFlightActivity).not.toHaveBeenCalled();
  });

  it("hydrate()에서 앱이 꺼진 동안 도착했으면 라이브액티비티를 종료한다", async () => {
    mockLoaded = {
      id: "x", origin: ICN, destination: NRT,
      departAt: Date.now() - 120_000, arriveAt: Date.now() - 1000,
    };
    const useFlightStore = freshStore();
    await useFlightStore.getState().hydrate();
    expect(mockEndFlightActivity).toHaveBeenCalledTimes(1);
    expect(mockStartFlightActivity).not.toHaveBeenCalled();
  });
});
