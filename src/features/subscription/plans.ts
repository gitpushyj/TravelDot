// 구독 플랜 정의. priceLabel/perMonthLabel은 RevenueCat Offerings 미설정/네트워크 실패
// 시의 fallback 값일 뿐, 실제 표시 가격은 usePlans()가 RC product에서 동적으로
// 사용자 device locale 기준으로 받아온다.

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

// App Store Connect 등록가 기준 (USD): yearly $24.99, monthly $5.99.
// $24.99 / 12 ≈ $2.08
// monthly $5.99 기준 yearly 환산 $71.88 → 할인율 65.2% → 표기상 65%
// (한국/일본 등 자국 통화는 Apple Pricing Tier가 자동 환산하므로 RC가 받아오는 값을 신뢰한다)
export const PLANS: Record<PlanId, Plan> = {
  yearly: {
    id: "yearly",
    priceLabel: "$24.99",
    perMonthLabel: "$2.08",
    savePercent: 65,
    freeTrialDays: 7,
  },
  monthly: {
    id: "monthly",
    priceLabel: "$5.99",
    perMonthLabel: "$5.99",
    savePercent: 0,
    freeTrialDays: 0,
  },
};
