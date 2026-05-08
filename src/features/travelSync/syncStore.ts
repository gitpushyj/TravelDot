import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { useAuthStore } from "../auth/authStore";
import { supabase } from "../../lib/supabase";
import { pullRemoteTrips } from "./syncPull";
import { pushPendingTrips } from "./syncPush";

const KEY_LAST_PUSHED = "tripSync:lastPushedAtMs";
const KEY_LAST_PULLED = "tripSync:lastPulledAtMs";

type State = {
  lastPushedAtMs: number | null;
  lastPulledAtMs: number | null;
  syncing: boolean;
  lastError: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  // 트립 변경 직후 호출. push가 진행 중이면 끝난 후에 한 번 더 돈다 (놓침 방지).
  requestSyncPush: () => Promise<void>;
  // 앱 시작·로그인 시 호출. push 후, tier가 premium 이상이면 pull까지.
  runFullSync: () => Promise<void>;
};

// syncing 도중 들어오는 추가 push 요청을 1회로 모아두는 플래그.
let pushPending = false;

export const useSyncStore = create<State>((set, get) => ({
  lastPushedAtMs: null,
  lastPulledAtMs: null,
  syncing: false,
  lastError: null,
  hydrated: false,

  hydrate: async () => {
    const [pushedRaw, pulledRaw] = await Promise.all([
      AsyncStorage.getItem(KEY_LAST_PUSHED),
      AsyncStorage.getItem(KEY_LAST_PULLED),
    ]);
    set({
      lastPushedAtMs: pushedRaw ? Number(pushedRaw) : null,
      lastPulledAtMs: pulledRaw ? Number(pulledRaw) : null,
      hydrated: true,
    });
  },

  requestSyncPush: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    if (get().syncing) {
      pushPending = true;
      return;
    }
    set({ syncing: true, lastError: null });
    try {
      const { newLastPushedAtMs } = await pushPendingTrips({
        userId,
        sinceMs: get().lastPushedAtMs,
      });
      if (
        newLastPushedAtMs != null &&
        newLastPushedAtMs !== get().lastPushedAtMs
      ) {
        await AsyncStorage.setItem(
          KEY_LAST_PUSHED,
          String(newLastPushedAtMs)
        );
        set({ lastPushedAtMs: newLastPushedAtMs });
      }
    } catch (e) {
      set({ lastError: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ syncing: false });
    }
    if (pushPending) {
      pushPending = false;
      void get().requestSyncPush();
    }
  },

  runFullSync: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    if (get().syncing) {
      // runFullSync가 이미 돌고 있는 도중에 다른 호출이 들어왔다면 자체적으로 큐만 세워둔다.
      pushPending = true;
      return;
    }
    set({ syncing: true, lastError: null });
    try {
      const tier = await fetchTier(userId);

      // push는 모든 tier에서 실행. 결제 후 무료 → 유료 전환 시 데이터 살아있게.
      const pushRes = await pushPendingTrips({
        userId,
        sinceMs: get().lastPushedAtMs,
      });
      if (
        pushRes.newLastPushedAtMs != null &&
        pushRes.newLastPushedAtMs !== get().lastPushedAtMs
      ) {
        await AsyncStorage.setItem(
          KEY_LAST_PUSHED,
          String(pushRes.newLastPushedAtMs)
        );
        set({ lastPushedAtMs: pushRes.newLastPushedAtMs });
      }

      // pull은 premium 이상(tier >= 1)만.
      if (tier >= 1) {
        const pullRes = await pullRemoteTrips({
          sinceMs: get().lastPulledAtMs,
        });
        if (
          pullRes.newLastPulledAtMs != null &&
          pullRes.newLastPulledAtMs !== get().lastPulledAtMs
        ) {
          await AsyncStorage.setItem(
            KEY_LAST_PULLED,
            String(pullRes.newLastPulledAtMs)
          );
          set({ lastPulledAtMs: pullRes.newLastPulledAtMs });
        }
      }
    } catch (e) {
      set({ lastError: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ syncing: false });
    }
    if (pushPending) {
      pushPending = false;
      void get().requestSyncPush();
    }
  },
}));

async function fetchTier(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("users")
    .select("tier")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return 0;
  return (data.tier as number) ?? 0;
}
