// 클라가 다루는 채팅 메시지. id/createdAt은 클라 생성. 서버 전송 시엔 role/text만 보낸다.

export type ChatRole = "user" | "assistant";

export type TierName = "free" | "premium" | "power";

// tier별 채팅 메모리 길이 (UI 표시 + LLM 컨텍스트 공통).
// 일일 한도와 동일한 숫자를 그대로 쓴다 (free=1, premium=10, power=30).
// 변경 시 docs/user-tier.md 와 supabase/functions/ai-chat/index.ts의 cap도 같이 본다.
export const MEMORY_BY_TIER: Record<TierName, number> = {
  free: 1,
  premium: 10,
  power: 30,
};

export const MAX_MEMORY = Math.max(...Object.values(MEMORY_BY_TIER));

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
