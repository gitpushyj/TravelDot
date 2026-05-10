import { Lock, Send } from "lucide-react-native";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "../../theme/themeStore";

const MAX = 150;

export type AiChatComposerHandle = {
  setText: (next: string) => void;
};

type Props = {
  isSending: boolean;
  disabled: boolean;
  onSend: (text: string) => void;
  // free tier 사용자에게 채팅을 완전히 막는다. true면 입력은 잠기고
  // 우측 버튼은 onUpgrade()로 결제 안내 화면을 연다.
  lockedForUpgrade?: boolean;
  onUpgrade?: () => void;
};

const AiChatComposer = forwardRef<AiChatComposerHandle, Props>(function AiChatComposer(
  { isSending, disabled, onSend, lockedForUpgrade, onUpgrade },
  ref
) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [text, setText] = useState("");

  useImperativeHandle(ref, () => ({ setText: (n: string) => setText(n) }), []);

  const trimmedLen = text.trim().length;
  const sendDisabled = disabled || isSending || trimmedLen === 0;

  const handleSend = () => {
    if (sendDisabled) return;
    const value = text.trim();
    setText("");
    onSend(value);
  };

  if (lockedForUpgrade) {
    return (
      <View style={styles.root}>
        <View style={styles.inputRow}>
          <View style={[styles.input, styles.inputLocked]}>
            <Text style={styles.inputLockedText} numberOfLines={2}>
              {t("aiChat.composerLockedPlaceholder")}
            </Text>
          </View>
          <Pressable
            onPress={onUpgrade}
            style={({ pressed }) => [
              styles.sendBtn,
              pressed ? styles.sendBtnPressed : null,
            ]}
            accessibilityLabel={t("aiChat.upgrade")}
          >
            <Lock size={20} color={theme.accentOn} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t("aiChat.composerPlaceholder")}
          placeholderTextColor={theme.textSecondary}
          editable={!disabled}
          multiline
          maxLength={MAX}
          style={styles.input}
        />
        <Pressable
          onPress={handleSend}
          disabled={sendDisabled}
          style={({ pressed }) => [
            styles.sendBtn,
            sendDisabled ? styles.sendBtnDisabled : null,
            pressed && !sendDisabled ? styles.sendBtnPressed : null,
          ]}
          accessibilityLabel={t("aiChat.send")}
        >
          {isSending ? (
            <ActivityIndicator color={theme.accentOn} />
          ) : (
            <Send size={20} color={theme.accentOn} />
          )}
        </Pressable>
      </View>
      <Text style={styles.counter}>
        {t("aiChat.composerCounter", { n: text.length })}
      </Text>
    </View>
  );
});

export default AiChatComposer;

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.cardBorder,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: theme.homeBg,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: theme.cardBg,
      color: theme.textPrimary,
      fontSize: 15,
    },
    inputLocked: {
      justifyContent: "center",
    },
    inputLockedText: {
      color: theme.textSecondary,
      fontSize: 15,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.accent,
    },
    sendBtnDisabled: { opacity: 0.4 },
    sendBtnPressed: { opacity: 0.8 },
    counter: {
      marginTop: 4,
      alignSelf: "flex-end",
      fontSize: 11,
      color: theme.textSecondary,
    },
  });
}
