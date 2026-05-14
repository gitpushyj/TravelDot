import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Keyboard,
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
import { useSubscription } from "../features/subscription/useSubscription";
import type { RootStackParamList } from "../navigation/types";
import { useTheme } from "../theme/themeStore";

export default function AiScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const safeInsets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const messages = useAiChatStore((s) => s.messages);
  const isSending = useAiChatStore((s) => s.isSending);
  const rateLimit = useAiChatStore((s) => s.rateLimit);
  const hydrate = useAiChatStore((s) => s.hydrate);
  const send = useAiChatStore((s) => s.send);
  const clear = useAiChatStore((s) => s.clear);

  // tier가 명확히 'free'인 경우만 잠금 — 아직 로드 전(null)일 땐 잠그지 않아
  // 유료 사용자가 잠깐이라도 잠금 UI를 보지 않게 한다.
  const { tier } = useSubscription();
  const lockedForUpgrade = tier === "free";

  const composerRef = useRef<AiChatComposerHandle>(null);
  const [copiedToastVisible, setCopiedToastVisible] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (userId) void hydrate(userId);
  }, [userId, hydrate]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleCopied = useCallback(() => {
    setCopiedToastVisible(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopiedToastVisible(false), 1500);
  }, []);

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

      {messages.length === 0 && !isSending ? (
        // 빈 상태는 스크롤이 없으므로 Pressable로 감싸 탭하면 키보드를 닫는다.
        <Pressable style={styles.body} onPress={Keyboard.dismiss}>
          <AiChatEmptyState
            onPickExample={(text) => composerRef.current?.setText(text)}
          />
        </Pressable>
      ) : (
        // 리스트는 Pressable로 감싸면 부모가 터치 responder를 잡아 빈 여백 스크롤이
        // 막힌다. AiChatList가 keyboardDismissMode로 키보드 닫기를 자체 처리한다.
        <View style={styles.body}>
          <AiChatList
            messages={messages}
            isThinking={isSending}
            onImagePress={onImagePress}
            onCopied={handleCopied}
          />
        </View>
      )}

      {copiedToastVisible ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{t("aiChat.copied")}</Text>
          </View>
        </View>
      ) : null}

      {rateLimit && !lockedForUpgrade ? <UsageLimitBanner /> : null}

      <AiChatComposer
        ref={composerRef}
        isSending={isSending}
        disabled={!!rateLimit}
        onSend={(text) => void send(text)}
        lockedForUpgrade={lockedForUpgrade}
        onUpgrade={() =>
          navigation.navigate("PremiumIntro", { returnToTab: "AI" })
        }
      />
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
    toastWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 88,
      alignItems: "center",
    },
    toast: {
      backgroundColor: theme.textPrimary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      opacity: 0.9,
    },
    toastText: { color: theme.homeBg, fontSize: 13, fontWeight: "500" },
  });
}
