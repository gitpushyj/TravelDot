import { useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import type { ChatMessage } from "../../features/aiChat/types";

import AiChatBubble from "./AiChatBubble";
import AiChatTypingBubble from "./AiChatTypingBubble";

type Props = {
  messages: ChatMessage[];
  isThinking: boolean;
  onImagePress: (url: string) => void;
  onCopied?: () => void;
};

export default function AiChatList({ messages, isThinking, onImagePress, onCopied }: Props) {
  // inverted FlatList엔 역순으로 넘긴다.
  const reversed = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <FlatList
      data={reversed}
      inverted
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => (
        <AiChatBubble message={item} onImagePress={onImagePress} onCopied={onCopied} />
      )}
      // inverted에서는 ListHeader가 시각적 하단(=마지막 메시지 아래)에 위치한다.
      ListHeaderComponent={isThinking ? <AiChatTypingBubble /> : null}
      contentContainerStyle={styles.content}
      keyboardDismissMode="interactive"
      // 빈 영역 탭은 키보드만 닫고, 자식(버블/이미지)의 onPress·onLongPress는 그대로 동작.
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View style={styles.sep} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 8 },
  sep: { height: 2 },
});
