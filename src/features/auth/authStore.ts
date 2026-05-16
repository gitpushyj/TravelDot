import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

import { clearMessages as clearAiChatMessages } from "../aiChat/aiChatStorage";
import {
  setSignupProviderProperty,
  trackSignedOut,
} from "../../lib/analyticsEvents";
import { logLogin, logSignUp, setUserId } from "../../lib/tracking";
import { supabase } from "../../lib/supabase";
import { AppleSignInCancelled, signInWithApple } from "./appleSignIn";
import {
  GoogleSignInCancelled,
  configureGoogleSignIn,
  signInWithGoogle,
  signOutFromGoogle,
} from "./googleSignIn";

// Supabase user.created_at이 30초 이내면 신규 가입(sign_up), 그렇지 않으면
// 재로그인(login)으로 본다. webhook 없이는 정확히 알 수 없지만, 첫 세션이
// 만들어진 직후의 윈도우는 거의 모든 신규 가입을 포착한다.
function isLikelyNewSignup(user: User | null): boolean {
  const createdAt = user?.created_at;
  if (!createdAt) return false;
  const createdMs = Date.parse(createdAt);
  if (!Number.isFinite(createdMs)) return false;
  return Date.now() - createdMs < 30_000;
}

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
    const initialUser = data.session?.user ?? null;
    set({
      session: data.session,
      user: initialUser,
      hydrated: true,
    });
    // Analytics user identity 동기화. cold-start에서 이미 로그인된 사용자는
    // hydrate 한 번이면 충분하고, 이후 로그인/로그아웃은 onAuthStateChange가 처리한다.
    setUserId(initialUser?.id ?? null);
    const initialProvider = initialUser?.app_metadata?.provider;
    if (initialProvider === "google" || initialProvider === "apple") {
      setSignupProviderProperty(initialProvider);
    }

    // 토큰 자동 갱신·다른 탭 변경 등을 store에 반영한다.
    if (!authSubscription) {
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        const nextUser = session?.user ?? null;
        set({ session, user: nextUser });
        // SIGNED_IN/SIGNED_OUT 이벤트에 맞춰 user_id를 동기화한다.
        // TOKEN_REFRESHED 같은 이벤트는 user가 바뀌지 않으므로 noop으로 둬도 무방.
        if (event === "SIGNED_OUT") {
          setUserId(null);
          trackSignedOut();
          return;
        }
        if (event === "SIGNED_IN" && nextUser) {
          setUserId(nextUser.id);
          const provider = nextUser.app_metadata?.provider;
          const method =
            provider === "google" || provider === "apple" ? provider : "unknown";
          if (provider === "google" || provider === "apple") {
            setSignupProviderProperty(provider);
          }
          if (isLikelyNewSignup(nextUser)) {
            logSignUp(method);
          } else {
            logLogin(method);
          }
        }
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
