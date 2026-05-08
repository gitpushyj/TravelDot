import {
  ALL_PREMIUM_MILESTONE_KINDS,
  isPremiumMilestoneKind,
  isMilestoneKind,
} from "./milestoneTypes";

describe("premium milestone types", () => {
  it("lists all 10 premium kinds", () => {
    expect(ALL_PREMIUM_MILESTONE_KINDS).toHaveLength(10);
  });
  it("isPremiumMilestoneKind discriminates correctly", () => {
    expect(isPremiumMilestoneKind("premium_n_before_n")).toBe(true);
    expect(isPremiumMilestoneKind("countries")).toBe(false);
  });
  it("isMilestoneKind accepts both base and premium", () => {
    expect(isMilestoneKind("countries")).toBe(true);
    expect(isMilestoneKind("premium_humanity")).toBe(true);
    expect(isMilestoneKind("nonsense")).toBe(false);
  });
});
