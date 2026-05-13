import React, { useMemo } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";

export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 16;
export const NICKNAME_WHITESPACE_RE = /\s/;

type Props = {
  value: string;
  onChange: (next: string) => void;
  errorKey: "tooShort" | "hasWhitespace" | null;
};

export default function NicknameCard({ value, onChange, errorKey }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // 공백 입력은 onChange 시점에 거르지 않는다. 거르면 "왜 안 입력되지?"라는
  // 혼란이 생기므로, 입력은 그대로 허용하고 인라인 에러로 안내한다.
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardLabel}>
          {t("onboarding.nickname.cardLabel")}
        </Text>
        <Text style={styles.counter}>
          {`${value.length}/${NICKNAME_MAX_LENGTH}`}
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t("onboarding.nickname.placeholder")}
        placeholderTextColor={theme.textMuted}
        maxLength={NICKNAME_MAX_LENGTH}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        style={[
          styles.input,
          errorKey !== null && styles.inputError,
        ]}
      />
      <Text
        style={[
          styles.errorText,
          errorKey === null && styles.errorTextHidden,
        ]}
        // 빈 에러일 때도 높이를 차지해서 레이아웃이 흔들리지 않도록 한다.
        numberOfLines={1}
      >
        {errorKey
          ? t(`onboarding.nickname.errors.${errorKey}`)
          : " "}
      </Text>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: 18,
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    cardLabel: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "800",
    },
    counter: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },
    input: {
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.optionBtnBorder,
      backgroundColor: theme.optionBtnBg,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 16,
      fontWeight: "600",
      color: theme.textPrimary,
    },
    inputError: {
      borderColor: theme.dangerOn,
    },
    errorText: {
      color: theme.dangerOn,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 8,
      minHeight: 16,
    },
    errorTextHidden: {
      opacity: 0,
    },
  });
}
