// 구독 처리의 백엔드 측면. 현재는 supabase.users.tier를 1로 직접 업데이트하는 스텁.
// 추후 RevenueCat / IAP 검증을 거치도록 교체할 때, 이 파일의 함수 시그니처만 유지하면 된다.

import { supabase } from "../../lib/supabase";

import type { PlanId } from "./plans";

export async function activateSubscription(
  userId: string,
  _plan: PlanId
): Promise<void> {
  // 스텁: 결제 검증 없이 tier를 premium(1)으로 올린다.
  const { error } = await supabase
    .from("users")
    .update({ tier: 1 })
    .eq("id", userId);
  if (error) throw error;
}
