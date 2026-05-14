// RevenueCat Offerings 에서 받아온 실가격을 Plan 형태로 매핑하는 hook.
// 로딩 중/Offerings 미설정/네트워크 실패 시 fallback PLANS(KRW 하드코딩)를 사용한다.
//
// SubscriptionScreen 등 표시부는 PLANS를 직접 import 하지 말고 이 hook을 통해
// 가격을 받는다. RC 대시보드에서 가격을 바꾸면 앱 재배포 없이 갱신된다.

import { useEffect, useState } from "react";
import * as Localization from "expo-localization";
import type { PurchasesPackage } from "react-native-purchases";

import { fetchCurrentOffering, findPackageForPlan } from "../../lib/revenuecat";

import { PLANS, type Plan, type PlanId } from "./plans";

type Result = {
  plans: Record<PlanId, Plan>;
  // RC Offerings 로드 성공 → true. fallback PLANS 표시 중일 때는 false.
  isFromOfferings: boolean;
};

function deviceLocaleTag(): string | undefined {
  return Localization.getLocales()[0]?.languageTag ?? undefined;
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(deviceLocaleTag(), {
      style: "currency",
      currency,
      // ₩, ¥ 등 정수 통화는 소수점 0, 그 외는 2자리.
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

// RC introPrice → 무료 체험 일수.
// product.introPrice가 정확히 0(=free trial)일 때만 일수로 변환한다. 할인된 유료
// intro 는 무료체험이 아니므로 0 으로 본다.
function freeTrialDaysOf(pkg: PurchasesPackage): number {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price > 0) return 0;
  const n = intro.periodNumberOfUnits;
  switch (intro.periodUnit) {
    case "DAY":
      return n;
    case "WEEK":
      return n * 7;
    case "MONTH":
      return n * 30;
    case "YEAR":
      return n * 365;
    default:
      return 0;
  }
}

function buildPlans(
  yearlyPkg: PurchasesPackage | null,
  monthlyPkg: PurchasesPackage | null
): Record<PlanId, Plan> | null {
  if (!yearlyPkg || !monthlyPkg) return null;

  const yearlyPrice = yearlyPkg.product.price;
  const monthlyPrice = monthlyPkg.product.price;
  const currency = yearlyPkg.product.currencyCode;

  const yearlyPerWeek = yearlyPrice / 52;
  const monthlyPerWeek = (monthlyPrice * 12) / 52;
  const monthlyAsYearly = monthlyPrice * 12;
  const savePercent =
    monthlyAsYearly > 0
      ? Math.round(((monthlyAsYearly - yearlyPrice) / monthlyAsYearly) * 100)
      : 0;

  return {
    yearly: {
      id: "yearly",
      priceLabel: yearlyPkg.product.priceString,
      perWeekLabel: formatCurrency(yearlyPerWeek, currency),
      savePercent: Math.max(0, savePercent),
      freeTrialDays: freeTrialDaysOf(yearlyPkg),
    },
    monthly: {
      id: "monthly",
      priceLabel: monthlyPkg.product.priceString,
      perWeekLabel: formatCurrency(monthlyPerWeek, currency),
      savePercent: 0,
      freeTrialDays: freeTrialDaysOf(monthlyPkg),
    },
  };
}

export function usePlans(): Result {
  const [dynamic, setDynamic] = useState<Record<PlanId, Plan> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const offering = await fetchCurrentOffering();
        if (!offering) return;
        const yearlyPkg = findPackageForPlan(offering, "yearly");
        const monthlyPkg = findPackageForPlan(offering, "monthly");
        const next = buildPlans(yearlyPkg, monthlyPkg);
        if (next && !cancelled) setDynamic(next);
      } catch {
        // RC 미설정/네트워크 실패 — fallback PLANS 사용.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    plans: dynamic ?? PLANS,
    isFromOfferings: dynamic !== null,
  };
}
