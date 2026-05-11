import React from "react";
import { Image, View, type ImageStyle, type StyleProp } from "react-native";

import { useResolvedUri } from "./useResolvedUri";

type Props = {
  id: string;
  uri: string;
  style: StyleProp<ImageStyle>;
};

// ph:// URI를 셀이 화면에 들어올 때만 file://로 해석하는 Image. 큰 사진첩에서도
// 동시 PHAsset.getAssetInfoAsync 호출이 visible window 크기로 제한된다.
export default function LazyAssetImage({ id, uri, style }: Props) {
  const resolved = useResolvedUri(id, uri);
  if (!resolved) return <View style={style} />;
  return <Image source={{ uri: resolved }} style={style} />;
}
