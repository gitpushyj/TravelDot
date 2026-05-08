import { useEntitlementStore } from "./entitlementStore";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

describe("entitlementStore", () => {
  beforeEach(() => {
    useEntitlementStore.setState({ isPremium: false, hydrated: false });
  });

  it("defaults to free user", () => {
    expect(useEntitlementStore.getState().isPremium).toBe(false);
  });

  it("setPremium toggles flag and persists", async () => {
    await useEntitlementStore.getState().setPremium(true);
    expect(useEntitlementStore.getState().isPremium).toBe(true);
  });
});
