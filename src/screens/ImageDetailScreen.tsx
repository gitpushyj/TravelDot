import { useCallback, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
} from "react-native";

import type { ImageDetailPhoto } from "../navigation/types";

import ImagePage from "./ImageDetailScreen/ImagePage";
import Overlay from "./ImageDetailScreen/Overlay";
import { SCREEN_WIDTH, styles } from "./ImageDetailScreen/styles";

type Props = {
  photos: ImageDetailPhoto[];
  initialIndex: number;
  title: string;
  flag: string;
  onClose: () => void;
};

const OVERLAY_FADE_MS = 180;

export default function ImageDetailScreen({
  photos,
  initialIndex,
  title,
  flag,
  onClose,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const overlayVisibleRef = useRef(true);

  const toggleOverlay = useCallback(() => {
    overlayVisibleRef.current = !overlayVisibleRef.current;
    Animated.timing(overlayOpacity, {
      toValue: overlayVisibleRef.current ? 1 : 0,
      duration: OVERLAY_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [overlayOpacity]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / SCREEN_WIDTH);
      if (next !== index) setIndex(next);
    },
    [index]
  );

  const current = photos[index];
  const caption = current ? formatCaption(current.date) : "";

  return (
    <View style={styles.root}>
      <FlatList
        data={photos}
        keyExtractor={(p) => p.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, i) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * i,
          index: i,
        })}
        onMomentumScrollEnd={onMomentumScrollEnd}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        renderItem={({ item }) => (
          <ImagePage uri={item.uri} onTap={toggleOverlay} />
        )}
      />
      <Overlay
        opacity={overlayOpacity}
        title={title}
        flag={flag}
        current={index + 1}
        total={photos.length}
        caption={caption}
        onClose={onClose}
      />
    </View>
  );
}

// "YYYY-MM-DD" → "YYYY.MM.DD". 형식이 깨졌다면 원문 그대로 표시.
function formatCaption(date: string): string {
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}
