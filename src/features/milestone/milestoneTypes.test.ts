import {
  ALL_PREMIUM_MILESTONE_KINDS,
  isPremiumMilestoneKind,
  isMilestoneKind,
} from "./milestoneTypes";

describe("premium milestone types", () => {
  it("lists all 6 premium kinds", () => {
    expect(ALL_PREMIUM_MILESTONE_KINDS).toHaveLength(6);
  });
  it("isPremiumMilestoneKind discriminates correctly", () => {
    expect(isPremiumMilestoneKind("premium_humanity")).toBe(true);
    expect(isPremiumMilestoneKind("countries")).toBe(false);
    // 제거된 종은 더 이상 premium kind가 아님
    expect(isPremiumMilestoneKind("premium_age_match")).toBe(false);
    expect(isPremiumMilestoneKind("premium_n_before_n")).toBe(false);
    expect(isPremiumMilestoneKind("premium_decade_stamps")).toBe(false);
    expect(isPremiumMilestoneKind("premium_four_seasons")).toBe(false);
  });
  it("isMilestoneKind accepts both base and premium", () => {
    expect(isMilestoneKind("countries")).toBe(true);
    expect(isMilestoneKind("premium_humanity")).toBe(true);
    expect(isMilestoneKind("nonsense")).toBe(false);
  });
});
