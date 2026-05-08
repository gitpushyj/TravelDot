import { useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import type { ChatMessage } from "../../features/aiChat/types";

import AiChatBubble from "./AiChatBubble";

type Props = {
  messages: ChatMessage[];
  onImagePress: (url: string) => void;
};

export default function AiChatList({ messages, onImagePress }: Props) {
  // inverted FlatList엔 역순으로 넘긴다.
  const reversed = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <FlatList
      data={reversed}
      inverted
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => (
        <AiChatBubble message={item} onImagePress={onImagePress} />
      )}
      contentContainerStyle={styles.content}
      keyboardDismissMode="interactive"
      ItemSeparatorComponent={() => <View style={styles.sep} />}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 8 },
  sep: { height: 2 },
});
