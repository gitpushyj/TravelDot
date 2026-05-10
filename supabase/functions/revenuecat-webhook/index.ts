// RevenueCat → Supabase webhook.
// RC가 결제/갱신/만료 이벤트마다 호출 → public.users.tier 를 0/1 로 갱신한다.
// 클라이언트는 이 값을 읽어 무료/유료 분기를 결정하므로 이 함수가 진실의 근원이다.
//
// 보안: RC 대시보드에서 Authorization header 값을 직접 지정한다.
// Edge Function 환경변수 REVENUECAT_WEBHOOK_AUTH 와 정확히 일치할 때만 처리.
//
// app_user_id: 클라이언트의 Purchases.logIn(userId) 에서 넘긴 값(= Supabase auth user.id).

import { createClient } from "supabase";

const WEBHOOK_AUTH = Deno.env.get("REVENUECAT_WEBHOOK_AUTH") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Tier = 0 | 1;

// RC event type → tier 매핑.
// CANCELLATION 은 자동갱신 해제일 뿐 만료 시점까지는 active 이므로 tier 변경 없음.
// EXPIRATION 이 와야 free 로 내린다.
function nextTierFor(eventType: string): Tier | null {
  switch (eventType) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "NON_RENEWING_PURCHASE":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
    case "TEMPORARY_ENTITLEMENT_GRANT":
      return 1;
    case "EXPIRATION":
      return 0;
    case "CANCELLATION":
    case "BILLING_ISSUE":
    case "SUBSCRIPTION_PAUSED":
    case "SUBSCRIBER_ALIAS":
    case "TRANSFER":
    case "TEST":
      return null;
    default:
      return null;
  }
}

function text(body: string, status = 200): Response {
  return new Response(body, { status });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return text("method not allowed", 405);

  if (!WEBHOOK_AUTH) {
    console.error("[rc-webhook] REVENUECAT_WEBHOOK_AUTH is not set");
    return text("server misconfigured", 500);
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== WEBHOOK_AUTH) return text("unauthorized", 401);

  let payload: { event?: { type?: string; app_user_id?: string } };
  try {
    payload = await req.json();
  } catch {
    return text("invalid json", 400);
  }

  const eventType = payload?.event?.type;
  const userId = payload?.event?.app_user_id;
  if (!eventType || !userId) return text("invalid event", 400);

  const tier = nextTierFor(eventType);
  if (tier === null) {
    // 무시할 이벤트는 200으로 응답해야 RC가 재시도하지 않는다.
    return text("ignored", 200);
  }

  // RC anonymous user($RCAnonymousID:...)는 Supabase에 매칭되는 row가 없다.
  // 이런 케이스는 silently skip — 클라이언트가 이후 logIn 시 RC가 alias로 머지해준다.
  if (userId.startsWith("$RCAnonymousID:")) {
    return text("anonymous skipped", 200);
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await sb.from("users").update({ tier }).eq("id", userId);
  if (error) {
    console.error("[rc-webhook] update failed", error.message, { userId, tier, eventType });
    return text(`db error: ${error.message}`, 500);
  }

  return text("ok", 200);
});
