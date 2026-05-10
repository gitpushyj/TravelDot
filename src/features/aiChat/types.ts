// 클라가 다루는 채팅 메시지. id/createdAt은 클라 생성. 서버 전송 시엔 role/text만 보낸다.

export type ChatRole = "user" | "assistant";

export type TierName = "free" | "premium" | "power";

// LLM에 보낼 컨텍스트 sliding window 길이. 일일 한도와 동일하게 둔다.
// 변경 시 docs/user-tier.md 와 supabase/functions/ai-chat/index.ts의 cap도 같이 본다.
export const MEMORY_BY_TIER: Record<TierName, number> = {
  free: 1,
  premium: 10,
  power: 30,
};

// 화면(채팅 내역)에 보여주는 sliding window 길이.
// 일일 한도가 적은 tier도 답답하지 않게 보이도록 LLM 컨텍스트보다 넉넉히 둔다.
export const UI_MEMORY_BY_TIER: Record<TierName, number> = {
  free: 4,
  premium: 20,
  power: 60,
};

export const MAX_MEMORY = Math.max(...Object.values(UI_MEMORY_BY_TIER));

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
  imageUrls?: string[]; // assistant 메시지 한정. 최대 4장.
  error?: string;       // assistant 응답이 실패했을 때 표시용 사유 (i18n 키)
};

export type SendOutcome =
  | { kind: "ok"; tier: TierName; usedToday: number; limit: number }
  | { kind: "rate_limited"; tier: TierName; limit: number }
  | { kind: "network" }
  | { kind: "invalid_input" }
  | { kind: "upstream" }
  | { kind: "unknown" };
