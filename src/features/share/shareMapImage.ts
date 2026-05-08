import type { RefObject } from "react";
import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from "./ShareMapCard";

export type CaptureResult = { uri: string };
export type ShareStatus = "shared" | "unavailable" | "failed";

// 카드 View 참조를 PNG 파일로 캡처해 임시 경로 URI를 반환한다.
// 카드는 1080×1920 layout으로 그려져 있고, view-shot은 unscaled bounds 기준으로
// 렌더하므로 결과 PNG도 1080×1920이 된다.
export async function captureShareCard(
  ref: RefObject<View | null>
): Promise<CaptureResult> {
  const node = ref.current;
  if (!node) throw new Error("share card ref not ready");
  const uri = await captureRef(node, {
    format: "png",
    quality: 1,
    result: "tmpfile",
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
  });
  return { uri };
}

export async function shareImage(
  uri: string,
  dialogTitle: string
): Promise<ShareStatus> {
  const available = await Sharing.isAvailableAsync();
  if (!available) return "unavailable";
  try {
    await Sharing.shareAsync(uri, {
      mimeType: "image/png",
      dialogTitle,
      UTI: "public.png",
    });
    return "shared";
  } catch {
    return "failed";
  }
}
