import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { ChatMessage } from "../../features/aiChat/types";
import { useTheme } from "../../theme/themeStore";

type Props = {
  message: ChatMessage;
  onImagePress: (url: string) => void;
};

export default function AiChatBubble({ message, onImagePress }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const isUser = message.role === "user";
  const text = message.error ? t(message.error) : message.text;

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
          message.error ? styles.bubbleError : null,
        ]}
      >
        {text ? (
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
            {text}
          </Text>
        ) : null}
        {message.imageUrls && message.imageUrls.length > 0 ? (
          <View style={styles.imageGrid}>
            {message.imageUrls.map((url) => (
              <Pressable
                key={url}
                style={styles.imageWrap}
                onPress={() => onImagePress(url)}
              >
                <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    row: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      flexDirection: "row",
    },
    rowUser: { justifyContent: "flex-end" },
    rowAssistant: { justifyContent: "flex-start" },
    bubble: {
      maxWidth: "82%",
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    bubbleUser: {
      backgroundColor: theme.accent,
      borderBottomRightRadius: 4,
    },
    bubbleAssistant: {
      backgroundColor: theme.cardBg,
      borderBottomLeftRadius: 4,
    },
    bubbleError: { opacity: 0.85 },
    text: { fontSize: 15, lineHeight: 21 },
    textUser: { color: theme.accentOn },
    textAssistant: { color: theme.textPrimary },
    imageGrid: {
      marginTop: 6,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
    },
    imageWrap: {
      width: "49%",
      aspectRatio: 1,
      borderRadius: 12,
      overflow: "hidden",
    },
    image: { width: "100%", height: "100%" },
  });
}
