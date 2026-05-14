import { supabase } from "../../lib/supabase";

import type { TierName } from "../aiChat/types";

// public.users.tier(0/1) → TierName 매핑.
// 행이 없거나 에러면 free로 fallback (기존 syncStore.fetchTier와 동일한 정책).
export async function fetchUserTier(userId: string): Promise<TierName> {
  const { data, error } = await supabase
    .from("users")
    .select("tier")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return "free";
  const n = (data.tier as number | null) ?? 0;
  if (n === 1) return "premium";
  return "free";
}
