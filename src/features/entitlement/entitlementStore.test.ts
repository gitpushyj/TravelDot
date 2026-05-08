import { useEntitlementStore } from "./entitlementStore";
import { fetchUserTier } from "../auth/userTier";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../auth/userTier", () => ({
  fetchUserTier: jest.fn(),
}));

describe("entitlementStore", () => {
  beforeEach(() => {
    useEntitlementStore.setState({
      isAllMilestoneVisible: false,
      hydrated: false,
    });
    (fetchUserTier as jest.Mock).mockReset();
  });

  it("defaults to free user", () => {
    expect(useEntitlementStore.getState().isAllMilestoneVisible).toBe(false);
  });

  it("setAllMilestoneVisible toggles flag and persists", async () => {
    await useEntitlementStore.getState().setAllMilestoneVisible(true);
    expect(useEntitlementStore.getState().isAllMilestoneVisible).toBe(true);
  });

  it("syncFromUserId flips the flag based on fetchUserTier", async () => {
    (fetchUserTier as jest.Mock).mockResolvedValueOnce("free");
    await useEntitlementStore.getState().syncFromUserId("user-1");
    expect(useEntitlementStore.getState().isAllMilestoneVisible).toBe(false);

    (fetchUserTier as jest.Mock).mockResolvedValueOnce("premium");
    await useEntitlementStore.getState().syncFromUserId("user-1");
    expect(useEntitlementStore.getState().isAllMilestoneVisible).toBe(true);

    (fetchUserTier as jest.Mock).mockResolvedValueOnce("free");
    await useEntitlementStore.getState().syncFromUserId("user-1");
    expect(useEntitlementStore.getState().isAllMilestoneVisible).toBe(false);
  });
});
