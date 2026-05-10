// 구독 결제 처리. RevenueCat이 영수증 검증/엔타이틀먼트 관리를 담당하며,
// 서버 측 public.users.tier는 RevenueCat webhook(Edge Function)이 갱신한다.
// 따라서 클라이언트에서 supabase.users.update 를 직접 호출하지 않는다.

import {
  hasActivePremium,
  purchasePackageForPlan,
  restorePurchases as rcRestore,
} from "../../lib/revenuecat";

import type { PlanId } from "./plans";

// 시그니처는 기존과 동일하게 유지(_userId는 호출부 호환). RC는 App.tsx에서 이미
// 같은 user.id로 logIn 되어있으므로 결제는 그 사용자에게 자동으로 귀속된다.
export async function activateSubscription(
  _userId: string,
  plan: PlanId
): Promise<void> {
  const result = await purchasePackageForPlan(plan);
  if (!hasActivePremium(result.customerInfo)) {
    throw new Error("purchase_no_entitlement");
  }
}

// Apple/Google 심사: 유료 기능을 가진 앱은 Restore Purchases가 반드시 노출되어야 한다.
// true = 복원 후 active premium 발견, false = 활성 구독 없음.
export async function restoreSubscription(): Promise<boolean> {
  const info = await rcRestore();
  if (!info) return false;
  return hasActivePremium(info);
}
