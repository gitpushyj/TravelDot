import type { ActiveFlight } from "../flightTypes";

// __DEV__는 RN 런타임 글로벌이라 jest(node) 환경엔 없다. 테스트용으로 정의.
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const flight: ActiveFlight = {
  id: "t1",
  origin: { iata: "ICN", name: "Incheon Intl", city: "Seoul", country: "KR", lat: 37.46, lng: 126.44 },
  destination: { iata: "NRT", name: "Narita Intl", city: "Tokyo", country: "JP", lat: 35.76, lng: 140.38 },
  departAt: 1_000_000,
  arriveAt: 9_000_000,
};

function loadWith(platformOS: string, native: any) {
  jest.resetModules();
  jest.doMock("react-native", () => ({ Platform: { OS: platformOS } }));
  jest.doMock("expo-modules-core", () => ({
    requireNativeModule: () => {
      if (!native) throw new Error("Cannot find native module");
      return native;
    },
  }));
  return require("../liveActivity");
}

describe("liveActivity", () => {
  afterEach(() => jest.resetModules());

  it("안드로이드에서는 네이티브를 호출하지 않고 조용히 no-op", async () => {
    const native = { isSupported: jest.fn(), start: jest.fn(), end: jest.fn() };
    const m = loadWith("android", native);
    await m.startFlightActivity(flight);
    await m.endFlightActivity();
    expect(native.start).not.toHaveBeenCalled();
    expect(native.end).not.toHaveBeenCalled();
  });

  it("iOS에서 모듈이 없으면 조용히 no-op", async () => {
    const m = loadWith("ios", null);
    await expect(m.startFlightActivity(flight)).resolves.toBeUndefined();
    await expect(m.endFlightActivity()).resolves.toBeUndefined();
  });

  it("iOS에서 ActiveFlight를 attributes로 변환해 start로 전달", async () => {
    const native = { isSupported: jest.fn(), start: jest.fn().mockResolvedValue(undefined), end: jest.fn().mockResolvedValue(undefined) };
    const m = loadWith("ios", native);
    await m.startFlightActivity(flight);
    expect(native.start).toHaveBeenCalledWith({
      originName: "Incheon Intl",
      originIata: "ICN",
      destName: "Narita Intl",
      destIata: "NRT",
      departAt: 1_000_000,
      arriveAt: 9_000_000,
    });
  });

  it("iOS에서 endFlightActivity는 native.end 호출", async () => {
    const native = { isSupported: jest.fn(), start: jest.fn(), end: jest.fn().mockResolvedValue(undefined) };
    const m = loadWith("ios", native);
    await m.endFlightActivity();
    expect(native.end).toHaveBeenCalledTimes(1);
  });

  it("native.start가 throw해도 startFlightActivity는 reject하지 않음", async () => {
    const native = { isSupported: jest.fn(), start: jest.fn().mockRejectedValue(new Error("boom")), end: jest.fn() };
    const m = loadWith("ios", native);
    await expect(m.startFlightActivity(flight)).resolves.toBeUndefined();
  });
});
