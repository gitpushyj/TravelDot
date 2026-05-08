import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

import { clearMessages as clearAiChatMessages } from "../aiChat/aiChatStorage";
import { supabase } from "../../lib/supabase";
import { AppleSignInCancelled, signInWithApple } from "./appleSignIn";
import {
  GoogleSignInCancelled,
  configureGoogleSignIn,
  signInWithGoogle,
  signOutFromGoogle,
} from "./googleSignIn";

type SignInResult =
  | { ok: true }
  | { ok: false; cancelled: boolean; message: string };

type State = {
  session: Session | null;
  user: User | null;
  hydrated: boolean;
  signingInProvider: "google" | "apple" | null;

  hydrate: () => Promise<void>;
  signInGoogle: () => Promise<SignInResult>;
  signInApple: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

let authSubscription: { unsubscribe: () => void } | null = null;

export const useAuthStore = create<State>((set) => ({
  session: null,
  user: null,
  hydrated: false,
  signingInProvider: null,

  hydrate: async () => {
    configureGoogleSignIn();

    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      hydrated: true,
    });

    // 토큰 자동 갱신·다른 탭 변경 등을 store에 반영한다.
    if (!authSubscription) {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null });
      });
      authSubscription = sub.subscription;
    }
  },

  signInGoogle: async () => {
    set({ signingInProvider: "google" });
    try {
      await signInWithGoogle();
      return { ok: true };
    } catch (e) {
      if (e instanceof GoogleSignInCancelled) {
        return { ok: false, cancelled: true, message: e.message };
      }
      const message = e instanceof Error ? e.message : String(e);
      return { ok: false, cancelled: false, message };
    } finally {
      set({ signingInProvider: null });
    }
  },

  signInApple: async () => {
    set({ signingInProvider: "apple" });
    try {
      await signInWithApple();
      return { ok: true };
    } catch (e) {
      if (e instanceof AppleSignInCancelled) {
        return { ok: false, cancelled: true, message: e.message };
      }
      const message = e instanceof Error ? e.message : String(e);
      return { ok: false, cancelled: false, message };
    } finally {
      set({ signingInProvider: null });
    }
  },

  signOut: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      try {
        await clearAiChatMessages(userId);
      } catch {
        // 메모리 정리 실패는 로그아웃 자체를 막지 않는다.
      }
    }
    await signOutFromGoogle();
    await supabase.auth.signOut();
  },
}));
