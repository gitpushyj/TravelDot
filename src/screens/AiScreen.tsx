import { Trash2 } from "lucide-react-native";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AiChatComposer,
  AiChatEmptyState,
  AiChatList,
  UsageLimitBanner,
  type AiChatComposerHandle,
} from "../components/AiChat";
import { useAiChatStore } from "../features/aiChat/aiChatStore";
import { useAuthStore } from "../features/auth/authStore";
import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { useTheme } from "../theme/themeStore";

export default function AiScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();
  const safeInsets = useSafeAreaInsets();

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const messages = useAiChatStore((s) => s.messages);
  const isSending = useAiChatStore((s) => s.isSending);
  const rateLimit = useAiChatStore((s) => s.rateLimit);
  const hydrate = useAiChatStore((s) => s.hydrate);
  const send = useAiChatStore((s) => s.send);
  const clear = useAiChatStore((s) => s.clear);

  const composerRef = useRef<AiChatComposerHandle>(null);

  useEffect(() => {
    if (userId) void hydrate(userId);
  }, [userId, hydrate]);

  const onClear = () => {
    if (messages.length === 0) return;
    Alert.alert(
      t("aiChat.confirmClear.title"),
      t("aiChat.confirmClear.body"),
      [
        { text: t("aiChat.confirmClear.cancel"), style: "cancel" },
        {
          text: t("aiChat.confirmClear.confirm"),
          style: "destructive",
          onPress: () => void clear(),
        },
      ]
    );
  };

  const onImagePress = (_url: string) => {
    // 차후 ImageDetailScreen에 url을 받게 확장. 현재는 noop.
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: safeInsets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t("aiChat.title")}</Text>
        <Pressable
          onPress={onClear}
          style={({ pressed }) => [styles.clearBtn, pressed ? styles.clearBtnPressed : null]}
          accessibilityLabel={t("aiChat.headerClear")}
          hitSlop={10}
        >
          <Trash2 size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {messages.length === 0 && !isSending ? (
          <AiChatEmptyState
            onPickExample={(text) => composerRef.current?.setText(text)}
          />
        ) : (
          <AiChatList
            messages={messages}
            isThinking={isSending}
            onImagePress={onImagePress}
          />
        )}
      </View>

      {rateLimit ? (
        <UsageLimitBanner tier={rateLimit.tier} limit={rateLimit.limit} />
      ) : null}

      <View style={{ paddingBottom: bottomInset }}>
        <AiChatComposer
          ref={composerRef}
          isSending={isSending}
          disabled={!!rateLimit}
          onSend={(text) => void send(text)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.homeBg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.cardBorder,
    },
    title: { fontSize: 18, fontWeight: "600", color: theme.textPrimary },
    clearBtn: { padding: 4, borderRadius: 8 },
    clearBtnPressed: { opacity: 0.6 },
    body: { flex: 1 },
  });
}
