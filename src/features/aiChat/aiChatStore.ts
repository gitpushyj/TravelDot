import { create } from "zustand";

import { fetchUserTier } from "../auth/userTier";

import { sendChat } from "./aiChatClient";
import { clearMessages, loadMessages, saveMessages } from "./aiChatStorage";
import { MEMORY_BY_TIER, type ChatMessage, type TierName } from "./types";

function uuid(): string {
  // expo-crypto가 따로 없으니 짧은 랜덤. 충돌 무시 가능 수준.
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type RateLimitInfo = { tier: TierName; limit: number };

type State = {
  loadedUserId: string | null;
  tier: TierName;
  messages: ChatMessage[];
  isSending: boolean;
  rateLimit: RateLimitInfo | null;

  hydrate: (userId: string) => Promise<void>;
  send: (text: string) => Promise<void>;
  clear: () => Promise<void>;
};

// store 안에서 자주 쓰는 짧은 헬퍼.
function capFor(tier: TierName): number {
  return MEMORY_BY_TIER[tier];
}

function trimByTier(messages: ChatMessage[], tier: TierName): ChatMessage[] {
  const cap = capFor(tier);
  return cap > 0 ? messages.slice(-cap) : [];
}

export const useAiChatStore = create<State>((set, get) => ({
  loadedUserId: null,
  tier: "free",
  messages: [],
  isSending: false,
  rateLimit: null,

  hydrate: async (userId) => {
    if (get().loadedUserId === userId) return;
    const [messages, tier] = await Promise.all([
      loadMessages(userId),
      fetchUserTier(userId),
    ]);
    set({
      loadedUserId: userId,
      tier,
      messages: trimByTier(messages, tier),
      rateLimit: null,
    });
  },

  send: async (text) => {
    const userId = get().loadedUserId;
    if (!userId || get().isSending) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const tier = get().tier;
    const cap = capFor(tier);

    const userMessage: ChatMessage = {
      id: uuid(),
      role: "user",
      text: trimmed,
      createdAt: Date.now(),
    };
    const historyForCall = get().messages;
    const after = trimByTier([...historyForCall, userMessage], tier);
    set({ messages: after, isSending: true });
    await saveMessages(userId, after, cap);

    const { outcome, assistant } = await sendChat({
      history: historyForCall,
      newUserText: trimmed,
      historyCap: cap,
    });

    if (outcome.kind === "ok" && assistant) {
      const aiMsg: ChatMessage = {
        id: uuid(),
        role: "assistant",
        text: assistant.text,
        imageUrls: assistant.imageUrls.length ? assistant.imageUrls : undefined,
        createdAt: Date.now(),
      };
      // 응답에 담긴 tier로 동기화 (서버가 권위 있는 출처).
      const newTier = outcome.tier;
      const newCap = capFor(newTier);
      const next = trimByTier([...after, aiMsg], newTier);
      set({ messages: next, isSending: false, rateLimit: null, tier: newTier });
      await saveMessages(userId, next, newCap);
      return;
    }

    if (outcome.kind === "rate_limited") {
      const aiMsg: ChatMessage = {
        id: uuid(),
        role: "assistant",
        text: "",
        error: `aiChat.error.rateLimited.${outcome.tier}`,
        createdAt: Date.now(),
      };
      const newCap = capFor(outcome.tier);
      const next = trimByTier([...after, aiMsg], outcome.tier);
      set({
        messages: next,
        isSending: false,
        rateLimit: { tier: outcome.tier, limit: outcome.limit },
        tier: outcome.tier,
      });
      await saveMessages(userId, next, newCap);
      return;
    }

    const errKey =
      outcome.kind === "network"
        ? "aiChat.error.network"
        : outcome.kind === "invalid_input"
        ? "aiChat.error.invalidInput"
        : "aiChat.error.generic";
    const aiMsg: ChatMessage = {
      id: uuid(),
      role: "assistant",
      text: "",
      error: errKey,
      createdAt: Date.now(),
    };
    const next = trimByTier([...after, aiMsg], tier);
    set({ messages: next, isSending: false });
    await saveMessages(userId, next, cap);
  },

  clear: async () => {
    const userId = get().loadedUserId;
    if (!userId) return;
    await clearMessages(userId);
    set({ messages: [], rateLimit: null });
  },
}));
