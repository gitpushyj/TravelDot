import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import i18n from "../../i18n";
import { supabase } from "../../lib/supabase";

const tr = (key: string) => i18n.t(key);

let configured = false;

/** Google Sign-In SDK를 한 번만 설정한다. webClientId는 Supabase 검증용으로 필수. */
export function configureGoogleSignIn() {
  if (configured) return;

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (!webClientId) {
    console.warn(`[auth] ${tr("errors.auth.missingClientId")}`);
    return;
  }

  GoogleSignin.configure({
    webClientId,
    iosClientId,
    scopes: ["profile", "email"],
  });

  configured = true;
}

export class GoogleSignInCancelled extends Error {
  constructor() {
    super(tr("errors.auth.googleSignInCancelled"));
    this.name = "GoogleSignInCancelled";
  }
}

/**
 * Google 네이티브 로그인을 띄우고 Supabase에 ID 토큰으로 세션을 만든다.
 * 사용자가 취소한 경우 GoogleSignInCancelled를 던진다.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!configured) {
    throw new Error(tr("errors.auth.googleSignInNotConfigured"));
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (response.type !== "success") {
    throw new GoogleSignInCancelled();
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error(tr("errors.auth.noIdToken"));
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });

  if (error) throw error;
}

export async function signOutFromGoogle(): Promise<void> {
  // 이미 로그아웃된 상태에서 호출되어도 조용히 통과시킨다.
  if (!GoogleSignin.hasPreviousSignIn()) return;
  try {
    await GoogleSignin.signOut();
  } catch {
    // native 측 에러는 Supabase 세션 정리를 막을 만큼 치명적이지 않다.
  }
}

export { statusCodes };
