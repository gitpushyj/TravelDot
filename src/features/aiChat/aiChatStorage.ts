import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ChatMessage } from "./types";

const KEY_PREFIX = "ai_chat:";
export const MAX_MEMORY_MESSAGES = 10;

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

export async function saveMessages(
  userId: string,
  messages: ChatMessage[]
): Promise<void> {
  const trimmed = messages.slice(-MAX_MEMORY_MESSAGES);
  await AsyncStorage.setItem(key(userId), JSON.stringify(trimmed));
}

export async function clearMessages(userId: string): Promise<void> {
  await AsyncStorage.removeItem(key(userId));
}
