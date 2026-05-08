// AI 채팅 Edge Function.
// - JWT 검증 → user_id
// - users.tier → 일일 한도
// - ai_chat_usage 카운터 검사 (KST 자정 기준)
// - trips 200건 조회 → systemPrompt 조립
// - OpenAI Responses API 호출 (web_search tool)
// - 성공 시에만 카운트 +1

import { createClient } from "supabase";
import { aggregateCountryStats, sortTripsForPrompt, type TripRow } from "./tripStats.ts";
import { buildSystemPrompt, type Gender } from "./systemPrompt.ts";

type TierName = "free" | "premium" | "power";

type IncomingMessage = { role: "user" | "assistant"; text: string };
type IncomingBody = { messages: IncomingMessage[] };

const TIER_LIMITS: Record<TierName, number> = {
  free: 1,
  premium: 10,
  power: 30,
};

const TIER_NAMES: Record<number, TierName> = { 0: "free", 1: "premium", 2: "power" };

const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-5.4-mini";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function todayKst(): string {
  const kstMs = Date.now() + 9 * 60 * 60 * 1000;
  return new Date(kstMs).toISOString().slice(0, 10);
}

function tierFromNumber(n: number | null | undefined): TierName {
  if (n == null) return "free";
  return TIER_NAMES[n] ?? "free";
}

// 만 나이 계산. KST 기준 오늘 날짜와 비교.
// 생일을 아직 안 지났으면 한 살 빼고, 월·일이 둘 다 null이면 단순히 (year - birthYear).
function computeAgeKst(
  birthYear: number | null,
  birthMonth: number | null,
  birthDay: number | null
): number | null {
  if (birthYear == null) return null;
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const ny = kst.getUTCFullYear();
  const nm = kst.getUTCMonth() + 1;
  const nd = kst.getUTCDate();
  let age = ny - birthYear;
  if (birthMonth != null && birthDay != null) {
    if (nm < birthMonth || (nm === birthMonth && nd < birthDay)) age -= 1;
  } else if (birthMonth != null) {
    if (nm < birthMonth) age -= 1;
  }
  return age >= 0 ? age : null;
}

function genderFromColumn(g: string | null | undefined): Gender {
  if (g === "male" || g === "female" || g === "other" || g === "prefer_not_to_say") return g;
  return null;
}

// Responses API 응답에서 텍스트만 안전하게 추출.
// 응답 schema는 tool 호출 등이 섞일 수 있어 output[].content[].text를 모은다.
type ResponsesContent = { type?: string; text?: string };
type ResponsesOutputItem = { type?: string; content?: ResponsesContent[] };
type ResponsesPayload = { output_text?: string; output?: ResponsesOutputItem[] };

function extractText(payload: ResponsesPayload): string {
  if (typeof payload.output_text === "string" && payload.output_text.length > 0) {
    return payload.output_text;
  }
  const parts: string[] = [];
  for (const item of payload.output ?? []) {
    for (const c of item.content ?? []) {
      if (typeof c.text === "string") parts.push(c.text);
    }
  }
  return parts.join("\n").trim();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!jwt) return json({ error: "unauthorized" }, 401);

  // 1) JWT → user
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser(jwt);
  if (userErr || !userRes.user) return json({ error: "unauthorized" }, 401);
  const user = userRes.user;

  // 2) Body 검증
  let body: IncomingBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_input", reason: "bad_json" }, 400);
  }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  // max = 가장 큰 tier(power=30) sliding window + 신규 1 = 31.
  if (messages.length < 1 || messages.length > 31) {
    return json({ error: "invalid_input", reason: "messages_count" }, 400);
  }
  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") {
      return json({ error: "invalid_input", reason: "role" }, 400);
    }
    if (typeof m.text !== "string" || m.text.length === 0 || m.text.length > 500) {
      return json({ error: "invalid_input", reason: "text_length" }, 400);
    }
  }
  if (messages[messages.length - 1].role !== "user") {
    return json({ error: "invalid_input", reason: "last_role" }, 400);
  }

  // 3) 사용자 행 조회 (service_role): tier(한도용) + 프로필(나이/성별)
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: userRow } = await adminClient
    .from("users")
    .select("tier,birth_year,birth_month,birth_day,gender")
    .eq("id", user.id)
    .maybeSingle();
  const tier = tierFromNumber(userRow?.tier as number | null | undefined);
  const limit = TIER_LIMITS[tier];
  const age = computeAgeKst(
    (userRow?.birth_year as number | null | undefined) ?? null,
    (userRow?.birth_month as number | null | undefined) ?? null,
    (userRow?.birth_day as number | null | undefined) ?? null
  );
  const gender = genderFromColumn(userRow?.gender as string | null | undefined);

  // 4) 일일 카운트 조회
  const day = todayKst();
  const { data: usageRow } = await adminClient
    .from("ai_chat_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("day_kst", day)
    .maybeSingle();
  const usedToday = (usageRow?.count as number | undefined) ?? 0;

  if (usedToday >= limit) {
    return json({ error: "rate_limited", tier, limit }, 429);
  }

  // 5) trips 200건
  const { data: tripRows } = await adminClient
    .from("trips")
    .select("country_code,start_date,end_date,body")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("start_date", { ascending: false })
    .limit(200);
  const trips = (tripRows ?? []) as TripRow[];

  // 6) systemPrompt
  const lang = (user.user_metadata?.lang as string | undefined) ?? "en";
  const systemPrompt = buildSystemPrompt({
    lang,
    age,
    gender,
    stats: aggregateCountryStats(trips),
    trips: sortTripsForPrompt(trips),
  });

  // 7) OpenAI Responses API
  if (!OPENAI_API_KEY) return json({ error: "internal" }, 500);

  const openaiInput = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.text })),
  ];
  let assistantText = "";
  try {
    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: openaiInput,
        tools: [{ type: "web_search" }],
        max_output_tokens: 1000,
      }),
    });
    if (!resp.ok) {
      console.error("openai_upstream_error", resp.status, await resp.text());
      return json({ error: "upstream_error" }, 502);
    }
    const payload = (await resp.json()) as ResponsesPayload;
    assistantText = extractText(payload);
  } catch (e) {
    console.error("openai_fetch_failed", e);
    return json({ error: "upstream_error" }, 502);
  }

  if (!assistantText) {
    return json({ error: "upstream_error" }, 502);
  }

  // 8) 성공한 경우에만 카운트 +1 (upsert 패턴)
  const newCount = usedToday + 1;
  const { error: upsertErr } = await adminClient
    .from("ai_chat_usage")
    .upsert(
      { user_id: user.id, day_kst: day, count: newCount, updated_at: new Date().toISOString() },
      { onConflict: "user_id,day_kst" }
    );
  if (upsertErr) console.error("ai_chat_usage_upsert_failed", upsertErr);

  return json({
    assistant: { text: assistantText },
    usage: { tier, usedToday: newCount, limit },
  });
});
