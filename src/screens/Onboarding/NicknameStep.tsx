import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Circle, Path } from "react-native-svg";

import { useProfileStore } from "../../features/onboarding/profileStore";
import { useTheme } from "../../theme/themeStore";

import NicknameCard, {
  NICKNAME_MIN_LENGTH,
  NICKNAME_WHITESPACE_RE,
} from "./NicknameCard";
import { makeOnboardingStyles } from "./styles";

type Props = { onNext: () => void };

type NicknameErrorKey = "tooShort" | "hasWhitespace";

function validateNickname(value: string): NicknameErrorKey | null {
  if (NICKNAME_WHITESPACE_RE.test(value)) return "hasWhitespace";
  if (value.length < NICKNAME_MIN_LENGTH) return "tooShort";
  return null;
}

export default function NicknameStep({ onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeOnboardingStyles(theme), [theme]);
  const local = useMemo(() => makeLocalStyles(theme), [theme]);

  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);

  const [value, setValue] = useState<string>(profile?.nickname ?? "");
  // 사용자가 입력을 시작했거나 다음 버튼을 한 번 눌러본 적이 있을 때만
  // 에러를 표시한다. 빈 입력 상태에서 곧장 빨갛게 띄우면 위협적이다.
  const [showErrors, setShowErrors] = useState<boolean>(
    (profile?.nickname ?? "").length > 0
  );
  const [submitting, setSubmitting] = useState(false);

  const errorKey = useMemo(() => validateNickname(value), [value]);
  const canSubmit = errorKey === null && !submitting;

  const onChange = (next: string) => {
    setValue(next);
    if (!showErrors && next.length > 0) setShowErrors(true);
  };

  const onSubmit = async () => {
    if (!showErrors) setShowErrors(true);
    if (!canSubmit) return;
    if (!profile) return;
    setSubmitting(true);
    try {
      await setProfile({ ...profile, nickname: value });
      onNext();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={local.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={local.header}>
          <NicknameBadge color={theme.accent} bgColor={theme.accentSoftBg} />
          <Text style={[styles.title, { marginTop: 16 }]}>
            {t("onboarding.nickname.title")}
          </Text>
          <Text style={styles.subtitle}>
            {t("onboarding.nickname.subtitle")}
          </Text>
        </View>

        <View style={local.cards}>
          <NicknameCard
            value={value}
            onChange={onChange}
            errorKey={showErrors ? errorKey : null}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && canSubmit && styles.primaryBtnPressed,
            !canSubmit && styles.primaryBtnDisabled,
          ]}
        >
          <Text style={styles.primaryBtnText}>
            {t("onboarding.nickname.next")}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function NicknameBadge({
  color,
  bgColor,
}: {
  color: string;
  bgColor: string;
}) {
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: bgColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={26} height={26} viewBox="0 0 24 24">
        <Circle
          cx={12}
          cy={8}
          r={3.6}
          stroke={color}
          strokeWidth={1.8}
          fill="none"
        />
        <Path
          d="M4.5 20c1.4-3.6 4.4-5.4 7.5-5.4s6.1 1.8 7.5 5.4"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

function makeLocalStyles(_theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    body: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 8,
    },
    header: {
      paddingTop: 8,
      paddingBottom: 20,
    },
    cards: {
      gap: 16,
    },
  });
}
