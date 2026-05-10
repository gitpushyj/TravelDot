// 구독 플랜 정의. priceLabel/perMonthLabel은 RevenueCat Offerings 미설정/네트워크 실패
// 시의 fallback 값일 뿐, 실제 표시 가격은 usePlans()가 RC product에서 동적으로 받아온다.

export type PlanId = "yearly" | "monthly";

export type Plan = {
  id: PlanId;
  // 표시용 정가
  priceLabel: string;
  // 월당 환산 가격 (yearly에만 의미 있음 — monthly는 자기 자신과 동일)
  perMonthLabel: string;
  // monthly 대비 할인율 (yearly에만 의미 있음, 0~100)
  savePercent: number;
  // 무료 체험 일수 (없으면 0)
  freeTrialDays: number;
};

// ₩29,000 / 12개월 ≈ ₩2,417 (소수점 버림)
// monthly ₩5,500 기준 yearly 환산 ₩66,000 → 할인율 56% → 표기상 56%
export const PLANS: Record<PlanId, Plan> = {
  yearly: {
    id: "yearly",
    priceLabel: "₩29,000",
    perMonthLabel: "₩2,417",
    savePercent: 56,
    freeTrialDays: 7,
  },
  monthly: {
    id: "monthly",
    priceLabel: "₩5,500",
    perMonthLabel: "₩5,500",
    savePercent: 0,
    freeTrialDays: 0,
  },
};
