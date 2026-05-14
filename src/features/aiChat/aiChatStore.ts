import { create } from "zustand";

import { fetchUserTier } from "../auth/userTier";

import { sendChat } from "./aiChatClient";
import { clearMessages, loadMessages, saveMessages } from "./aiChatStorage";
import {
  MEMORY_BY_TIER,
  UI_MEMORY_BY_TIER,
  type ChatMessage,
  type TierName,
} from "./types";

function uuid(): string {
  // expo-crypto가 따로 없으니 짧은 랜덤. 충돌 무시 가능 수준.
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type State = {
  loadedUserId: string | null;
  tier: TierName;
  messages: ChatMessage[];
  isSending: boolean;
  rateLimit: boolean;

  hydrate: (userId: string) => Promise<void>;
  send: (text: string) => Promise<void>;
  clear: () => Promise<void>;
};

// UI(채팅 내역)에 보여주는 sliding window 길이.
function uiCapFor(tier: TierName): number {
  return UI_MEMORY_BY_TIER[tier];
}

// LLM 컨텍스트에 넘기는 sliding window 길이 (일일 한도와 동일).
function historyCapFor(tier: TierName): number {
  return MEMORY_BY_TIER[tier];
}

function trimByTier(messages: ChatMessage[], tier: TierName): ChatMessage[] {
  const cap = uiCapFor(tier);
  return cap > 0 ? messages.slice(-cap) : [];
}

export const useAiChatStore = create<State>((set, get) => ({
  loadedUserId: null,
  tier: "free",
  messages: [],
  isSending: false,
  rateLimit: false,

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
      rateLimit: false,
    });
  },

  send: async (text) => {
    const userId = get().loadedUserId;
    if (!userId || get().isSending) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const tier = get().tier;
    const uiCap = uiCapFor(tier);

    const userMessage: ChatMessage = {
      id: uuid(),
      role: "user",
      text: trimmed,
      createdAt: Date.now(),
    };
    const historyForCall = get().messages;
    const after = trimByTier([...historyForCall, userMessage], tier);
    set({ messages: after, isSending: true });
    await saveMessages(userId, after, uiCap);

    const { outcome, assistant } = await sendChat({
      history: historyForCall,
      newUserText: trimmed,
      historyCap: historyCapFor(tier),
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
      const next = trimByTier([...after, aiMsg], newTier);
      set({ messages: next, isSending: false, rateLimit: false, tier: newTier });
      await saveMessages(userId, next, uiCapFor(newTier));
      return;
    }

    if (outcome.kind === "rate_limited") {
      const aiMsg: ChatMessage = {
        id: uuid(),
        role: "assistant",
        text: "",
        error: "aiChat.error.rateLimited",
        createdAt: Date.now(),
      };
      const next = trimByTier([...after, aiMsg], outcome.tier);
      set({
        messages: next,
        isSending: false,
        rateLimit: true,
        tier: outcome.tier,
      });
      await saveMessages(userId, next, uiCapFor(outcome.tier));
      return;
    }

    const errKey =
      outcome.kind === "network"
        ? "aiChat.error.network"
        : outcome.kind === "invalid_input"
        ? "aiChat.error.invalidInput"
        : outcome.kind === "upstream"
        ? "aiChat.error.upstream"
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
    await saveMessages(userId, next, uiCap);
  },

  clear: async () => {
    const userId = get().loadedUserId;
    if (!userId) return;
    await clearMessages(userId);
    set({ messages: [], rateLimit: false });
  },
}));
