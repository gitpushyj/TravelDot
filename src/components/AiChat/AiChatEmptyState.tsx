import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../theme/themeStore";

type Props = {
  onPickExample: (text: string) => void;
};

const KEYS = [
  "aiChat.exampleNextDestination",
  "aiChat.exampleSafety",
  "aiChat.examplePattern",
] as const;

export default function AiChatEmptyState({ onPickExample }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // chip이 차지하지 않은 빈 영역 탭으로 키보드를 내리기 위해 root 자체를 Pressable로 둔다.
  return (
    <Pressable style={styles.root} onPress={Keyboard.dismiss}>
      <Text style={styles.heading}>{t("aiChat.empty.heading")}</Text>
      <Text style={styles.sub}>{t("aiChat.empty.subheading")}</Text>
      <View style={styles.chips}>
        {KEYS.map((k) => {
          const label = t(k);
          return (
            <Pressable
              key={k}
              style={({ pressed }) => [
                styles.chip,
                pressed ? styles.chipPressed : null,
              ]}
              onPress={() => onPickExample(label)}
            >
              <Text style={styles.chipText}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Pressable>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 8,
    },
    heading: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.textPrimary,
      textAlign: "center",
    },
    sub: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 16,
    },
    chips: { width: "100%", gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.cardBorder,
    },
    chipPressed: { opacity: 0.7 },
    chipText: { color: theme.textPrimary, fontSize: 14 },
  });
}
