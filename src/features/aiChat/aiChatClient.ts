import { supabase } from "../../lib/supabase";

import { parseAssistantText } from "./parseAssistantText";
import type { ChatMessage, SendOutcome, TierName } from "./types";

type WireMessage = { role: "user" | "assistant"; text: string };
type WireResponse = {
  assistant?: { text: string };
  usage?: { tier: TierName; usedToday: number; limit: number };
  error?: string;
  tier?: TierName;
  limit?: number;
};

export type SendArgs = {
  history: ChatMessage[]; // 전송 전 sliding window
  newUserText: string;
  historyCap: number;     // tier별 sliding window 길이 (MEMORY_BY_TIER)
};

export type SendResult = {
  outcome: SendOutcome;
  assistant: { text: string; imageUrls: string[] } | null;
};

function toWire(
  messages: ChatMessage[],
  newUserText: string,
  historyCap: number
): WireMessage[] {
  // 에러 어시스턴트 버블(text="" + error key)이나 빈 텍스트 메시지는 LLM 컨텍스트에서 제외.
  // Edge Function의 length === 0 검증에 걸리지 않게 + LLM이 빈 턴을 학습하지 않게.
  // 그리고 tier별 sliding window cap (MEMORY_BY_TIER)을 호출 측이 결정.
  const recent = messages
    .filter((m) => !m.error && m.text.trim().length > 0)
    .slice(-Math.max(0, historyCap));
  const arr: WireMessage[] = recent.map((m) => ({ role: m.role, text: m.text }));
  arr.push({ role: "user", text: newUserText });
  return arr;
}

export async function sendChat({ history, newUserText, historyCap }: SendArgs): Promise<SendResult> {
  try {
    const { data, error } = await supabase.functions.invoke<WireResponse>("ai-chat", {
      body: { messages: toWire(history, newUserText, historyCap) },
    });

    // 비즈니스 응답(rate_limited / invalid_input)은 Edge Function이 status 200 + body로 보낸다.
    // 따라서 data를 먼저 본다. data.error가 있으면 그걸로 분기, 그 다음 정상 응답, 마지막에 error 객체.
    if (data?.error === "rate_limited" && data.tier && data.limit != null) {
      return {
        outcome: { kind: "rate_limited", tier: data.tier, limit: data.limit },
        assistant: null,
      };
    }
    if (data?.error === "invalid_input") {
      return { outcome: { kind: "invalid_input" }, assistant: null };
    }
    if (data?.assistant?.text && data.usage) {
      const parsed = parseAssistantText(data.assistant.text);
      return {
        outcome: {
          kind: "ok",
          tier: data.usage.tier,
          usedToday: data.usage.usedToday,
          limit: data.usage.limit,
        },
        assistant: parsed,
      };
    }

    // 여기 도달 = 진짜 시스템 에러(401/502/500) 또는 예기치 않은 응답.
    if (error) {
      // 가능하면 응답 body를 한 번 더 읽어 분류 시도.
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") {
        try {
          const errBody = (await ctx.json()) as WireResponse;
          if (errBody?.error === "upstream_error") {
            return { outcome: { kind: "upstream" }, assistant: null };
          }
        } catch {
          // body 읽기 실패는 무시 (이미 한 번 읽혔거나 형식 다름)
        }
      }
    }
    return { outcome: { kind: "upstream" }, assistant: null };
  } catch {
    return { outcome: { kind: "network" }, assistant: null };
  }
}
