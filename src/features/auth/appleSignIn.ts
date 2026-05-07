import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";

import i18n from "../../i18n";
import { supabase } from "../../lib/supabase";

const tr = (key: string) => i18n.t(key);

export class AppleSignInCancelled extends Error {
  constructor() {
    super(tr("errors.auth.appleSignInCancelled"));
    this.name = "AppleSignInCancelled";
  }
}

/** iOS 기기에서 Apple Sign In을 사용할 수 있는지 확인. Android/Web에서는 항상 false. */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Apple 네이티브 로그인을 띄우고 Supabase에 ID 토큰으로 세션을 만든다.
 * 사용자가 취소한 경우 AppleSignInCancelled를 던진다.
 */
export async function signInWithApple(): Promise<void> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e: any) {
    // ERR_REQUEST_CANCELED: 사용자가 시트를 닫음
    if (e?.code === "ERR_REQUEST_CANCELED") {
      throw new AppleSignInCancelled();
    }
    throw e;
  }

  const idToken = credential.identityToken;
  if (!idToken) {
    throw new Error(tr("errors.auth.noIdToken"));
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: idToken,
  });

  if (error) throw error;
}
