import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

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
  signingIn: boolean;

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
  signingIn: false,

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
    set({ signingIn: true });
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
      set({ signingIn: false });
    }
  },

  signInApple: async () => {
    set({ signingIn: true });
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
      set({ signingIn: false });
    }
  },

  signOut: async () => {
    await signOutFromGoogle();
    await supabase.auth.signOut();
  },
}));
