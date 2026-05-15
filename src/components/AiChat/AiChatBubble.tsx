import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

import type { ChatMessage } from "../../features/aiChat/types";
import { useTheme } from "../../theme/themeStore";

type Props = {
  message: ChatMessage;
  onImagePress: (url: string) => void;
  onCopied?: () => void;
};

export default function AiChatBubble({ message, onImagePress, onCopied }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const markdownStyles = useMemo(() => makeMarkdownStyles(theme), [theme]);

  const isUser = message.role === "user";
  const fallbackText = message.error ? t(message.error) : message.text;
  const useMarkdown = !isUser && !message.error && message.text.length > 0;

  const copyText = useMarkdown ? message.text : fallbackText;
  const handleLongPress = async () => {
    if (!copyText) return;
    await Clipboard.setStringAsync(copyText);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCopied?.();
  };

  // LLM이 만들어낸 이미지 URL은 404/비이미지/hotlink 차단 등으로 로드에 실패할 수 있다.
  // 실패한 URL은 그리드에서 제거 → 전부 실패하면 imageGrid 자체가 사라져 "빈 박스" 증상 방지.
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const handleImageError = useCallback((url: string) => {
    setFailedUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);
  const visibleImageUrls = useMemo(
    () => (message.imageUrls ?? []).filter((url) => !failedUrls.has(url)),
    [message.imageUrls, failedUrls]
  );

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={350}
        style={({ pressed }) => [
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
          message.error ? styles.bubbleError : null,
          pressed && copyText ? styles.bubblePressed : null,
        ]}
      >
        {useMarkdown ? (
          <Markdown style={markdownStyles}>{message.text}</Markdown>
        ) : fallbackText ? (
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
            {fallbackText}
          </Text>
        ) : null}
        {visibleImageUrls.length > 0 ? (
          <View style={styles.imageGrid}>
            {visibleImageUrls.map((url) => (
              <Pressable
                key={url}
                style={styles.imageWrap}
                onPress={() => onImagePress(url)}
              >
                <Image
                  source={{ uri: url }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={() => handleImageError(url)}
                />
              </Pressable>
            ))}
          </View>
        ) : null}
      </Pressable>
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
    bubblePressed: { opacity: 0.7 },
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

// 마크다운 element 별 색/사이즈를 테마와 묶어서 정의.
// react-native-markdown-display의 style prop은 RN StyleSheet 객체와 호환.
function makeMarkdownStyles(theme: ReturnType<typeof useTheme>) {
  return {
    body: { color: theme.textPrimary, fontSize: 15, lineHeight: 22 },
    paragraph: { marginTop: 0, marginBottom: 6 },
    heading1: { fontSize: 18, fontWeight: "700" as const, marginTop: 4, marginBottom: 4 },
    heading2: { fontSize: 17, fontWeight: "700" as const, marginTop: 4, marginBottom: 4 },
    heading3: { fontSize: 16, fontWeight: "600" as const, marginTop: 4, marginBottom: 4 },
    strong: { fontWeight: "700" as const },
    em: { fontStyle: "italic" as const },
    bullet_list: { marginVertical: 2 },
    ordered_list: { marginVertical: 2 },
    list_item: { marginBottom: 2 },
    code_inline: {
      fontFamily: "Courier",
      backgroundColor: theme.cardBorder,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    fence: {
      fontFamily: "Courier",
      backgroundColor: theme.cardBorder,
      padding: 8,
      borderRadius: 8,
    },
    code_block: {
      fontFamily: "Courier",
      backgroundColor: theme.cardBorder,
      padding: 8,
      borderRadius: 8,
    },
    link: { color: theme.accent, textDecorationLine: "underline" as const },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: theme.cardBorder,
      paddingLeft: 8,
      marginVertical: 4,
      opacity: 0.85,
    },
    hr: { backgroundColor: theme.cardBorder, height: 1, marginVertical: 6 },
  };
}
