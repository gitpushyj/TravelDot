import { create } from "zustand";

import { sendChat } from "./aiChatClient";
import { clearMessages, loadMessages, saveMessages } from "./aiChatStorage";
import type { ChatMessage, TierName } from "./types";

function uuid(): string {
  // expo-crypto가 따로 없으니 짧은 랜덤. 충돌 무시 가능 수준.
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type RateLimitInfo = { tier: TierName; limit: number };

type State = {
  loadedUserId: string | null;
  messages: ChatMessage[];
  isSending: boolean;
  rateLimit: RateLimitInfo | null;

  hydrate: (userId: string) => Promise<void>;
  send: (text: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const useAiChatStore = create<State>((set, get) => ({
  loadedUserId: null,
  messages: [],
  isSending: false,
  rateLimit: null,

  hydrate: async (userId) => {
    if (get().loadedUserId === userId) return;
    const messages = await loadMessages(userId);
    set({ loadedUserId: userId, messages, rateLimit: null });
  },

  send: async (text) => {
    const userId = get().loadedUserId;
    if (!userId || get().isSending) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: uuid(),
      role: "user",
      text: trimmed,
      createdAt: Date.now(),
    };
    const historyForCall = get().messages;
    const after = [...historyForCall, userMessage];
    set({ messages: after, isSending: true });
    await saveMessages(userId, after);

    const { outcome, assistant } = await sendChat({
      history: historyForCall,
      newUserText: trimmed,
    });

    if (outcome.kind === "ok" && assistant) {
      const aiMsg: ChatMessage = {
        id: uuid(),
        role: "assistant",
        text: assistant.text,
        imageUrls: assistant.imageUrls.length ? assistant.imageUrls : undefined,
        createdAt: Date.now(),
      };
      const next = [...after, aiMsg];
      set({ messages: next, isSending: false, rateLimit: null });
      await saveMessages(userId, next);
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
      const next = [...after, aiMsg];
      set({
        messages: next,
        isSending: false,
        rateLimit: { tier: outcome.tier, limit: outcome.limit },
      });
      await saveMessages(userId, next);
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
    const next = [...after, aiMsg];
    set({ messages: next, isSending: false });
    await saveMessages(userId, next);
  },

  clear: async () => {
    const userId = get().loadedUserId;
    if (!userId) return;
    await clearMessages(userId);
    set({ messages: [], rateLimit: null });
  },
}));
