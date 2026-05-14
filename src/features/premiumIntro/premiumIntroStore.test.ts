import AsyncStorage from "@react-native-async-storage/async-storage";

import { usePremiumIntroStore } from "./premiumIntroStore";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

describe("premiumIntroStore", () => {
  beforeEach(() => {
    usePremiumIntroStore.setState({ hydrated: false, seen: false });
    (AsyncStorage.getItem as jest.Mock).mockReset().mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockReset().mockResolvedValue(undefined);
  });

  it("defaults to not hydrated and not seen", () => {
    expect(usePremiumIntroStore.getState().hydrated).toBe(false);
    expect(usePremiumIntroStore.getState().seen).toBe(false);
  });

  it("hydrate reads seen=true when storage holds '1'", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("1");
    await usePremiumIntroStore.getState().hydrate();
    expect(usePremiumIntroStore.getState().seen).toBe(true);
    expect(usePremiumIntroStore.getState().hydrated).toBe(true);
  });

  it("hydrate keeps seen=false when storage is empty", async () => {
    await usePremiumIntroStore.getState().hydrate();
    expect(usePremiumIntroStore.getState().seen).toBe(false);
    expect(usePremiumIntroStore.getState().hydrated).toBe(true);
  });

  it("markSeen sets the flag and persists '1'", async () => {
    await usePremiumIntroStore.getState().markSeen();
    expect(usePremiumIntroStore.getState().seen).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "visitgrid:premiumIntro:seen_v1",
      "1"
    );
  });

  it("markSeen is a no-op when already seen", async () => {
    usePremiumIntroStore.setState({ hydrated: true, seen: true });
    await usePremiumIntroStore.getState().markSeen();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});
