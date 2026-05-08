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
};

export type SendResult = {
  outcome: SendOutcome;
  assistant: { text: string; imageUrls: string[] } | null;
};

// Edge Function이 허용하는 메시지 개수 = 최근 10 + 신규 1 = 11.
// 클라 store는 UX를 위해 누적되므로(사용자가 스크롤해서 과거 대화 볼 수 있게)
// 여기서 보낼 때만 sliding window를 적용한다.
const HISTORY_CAP = 10;

function toWire(messages: ChatMessage[], newUserText: string): WireMessage[] {
  // 에러 어시스턴트 버블(text="" + error key)이나 빈 텍스트 메시지는 LLM 컨텍스트에서 제외.
  // Edge Function의 length === 0 검증에 걸리지 않게 + LLM이 빈 턴을 학습하지 않게.
  const recent = messages
    .filter((m) => !m.error && m.text.trim().length > 0)
    .slice(-HISTORY_CAP);
  const arr: WireMessage[] = recent.map((m) => ({ role: m.role, text: m.text }));
  arr.push({ role: "user", text: newUserText });
  return arr;
}

export async function sendChat({ history, newUserText }: SendArgs): Promise<SendResult> {
  try {
    const { data, error } = await supabase.functions.invoke<WireResponse>("ai-chat", {
      body: { messages: toWire(history, newUserText) },
    });
    if (error) {
      // supabase.functions.invoke는 4xx/5xx도 error로 표면화한다. body 우선 분기.
      const body = (error as { context?: { body?: WireResponse } })?.context?.body;
      if (body?.error === "rate_limited" && body.tier && body.limit != null) {
        return {
          outcome: { kind: "rate_limited", tier: body.tier, limit: body.limit },
          assistant: null,
        };
      }
      if (body?.error === "invalid_input") {
        return { outcome: { kind: "invalid_input" }, assistant: null };
      }
      if (body?.error === "upstream_error") {
        return { outcome: { kind: "upstream" }, assistant: null };
      }
      return { outcome: { kind: "unknown" }, assistant: null };
    }
    if (!data?.assistant?.text || !data.usage) {
      return { outcome: { kind: "upstream" }, assistant: null };
    }
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
  } catch {
    return { outcome: { kind: "network" }, assistant: null };
  }
}
