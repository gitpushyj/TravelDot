// 구독 플랜 정의. 가격은 모든 locale에서 KRW로 통일한다.
// 추후 RevenueCat 등으로 교체 시 이 파일의 priceLabel을 productId 기반으로 바꾼다.

export type PlanId = "yearly" | "weekly";

export type Plan = {
  id: PlanId;
  // 표시용 정가
  priceLabel: string;
  // 주당 환산 가격 (yearly에만 의미 있음)
  perWeekLabel: string;
  // weekly 대비 할인율 (yearly에만 의미 있음, 0~100)
  savePercent: number;
  // 무료 체험 일수 (없으면 0)
  freeTrialDays: number;
};

// ₩29,000 / 52주 ≈ ₩558 (소수점 버림)
// weekly ₩6,618 기준 yearly 환산 ₩344,136 → 할인율 91.6% → 표기상 92%
export const PLANS: Record<PlanId, Plan> = {
  yearly: {
    id: "yearly",
    priceLabel: "₩29,000",
    perWeekLabel: "₩558",
    savePercent: 92,
    freeTrialDays: 3,
  },
  weekly: {
    id: "weekly",
    priceLabel: "₩6,618",
    perWeekLabel: "₩6,618",
    savePercent: 0,
    freeTrialDays: 0,
  },
};
