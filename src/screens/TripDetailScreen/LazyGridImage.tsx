import React from "react";
import { Image, View, type ImageStyle, type StyleProp } from "react-native";

import { useResolvedUri } from "../../features/photoSync/useResolvedUri";

type Props = {
  id: string;
  uri: string;
  style: StyleProp<ImageStyle>;
};

export default function LazyGridImage({ id, uri, style }: Props) {
  const resolved = useResolvedUri(id, uri);
  if (!resolved) {
    return <View style={style} />;
  }
  return <Image source={{ uri: resolved }} style={style} />;
}
