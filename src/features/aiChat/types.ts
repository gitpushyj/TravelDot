// 클라가 다루는 채팅 메시지. id/createdAt은 클라 생성. 서버 전송 시엔 role/text만 보낸다.

export type ChatRole = "user" | "assistant";

export type TierName = "free" | "premium" | "power";

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
