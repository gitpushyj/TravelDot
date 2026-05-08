import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ChatMessage } from "./types";

const KEY_PREFIX = "ai_chat:";

function key(userId: string): string {
  return KEY_PREFIX + userId;
}

export async function loadMessages(userId: string): Promise<ChatMessage[]> {
  const raw = await AsyncStorage.getItem(key(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ChatMessage[];
  } catch {
    return [];
  }
}

// 호출 측이 tier에 맞는 cap을 결정해서 넘긴다 (MEMORY_BY_TIER).
export async function saveMessages(
  userId: string,
  messages: ChatMessage[],
  cap: number
): Promise<void> {
  const trimmed = cap > 0 ? messages.slice(-cap) : [];
  await AsyncStorage.setItem(key(userId), JSON.stringify(trimmed));
}

export async function clearMessages(userId: string): Promise<void> {
  await AsyncStorage.removeItem(key(userId));
}
