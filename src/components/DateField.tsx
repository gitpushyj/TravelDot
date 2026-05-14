import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../theme/themeStore";
import type { Theme } from "../theme/theme";
import { isValidDateKey } from "../utils/date";

import DatePickerSheet from "./DatePickerSheet";

type Props = {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
  // 시트 상단에 표시되는 제목. 보통 label과 같은 값을 그대로 넘긴다.
  sheetTitle?: string;
};

function formatDisplay(v: string): string {
  if (!isValidDateKey(v)) return v;
  const [y, m, d] = v.split("-");
  return `${y}. ${m}. ${d}.`;
}

export default function DateField({
  label,
  value,
  onChange,
  sheetTitle,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.input,
          pressed && styles.inputPressed,
        ]}
      >
        <Text
          style={[
            styles.inputText,
            !isValidDateKey(value) && styles.inputTextMuted,
          ]}
        >
          {formatDisplay(value) || "YYYY-MM-DD"}
        </Text>
      </Pressable>
      <DatePickerSheet
        visible={open}
        value={value}
        title={sheetTitle ?? label}
        onCancel={() => setOpen(false)}
        onConfirm={(v) => {
          setOpen(false);
          onChange(v);
        }}
      />
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    field: { flex: 1, gap: 4 },
    label: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "700",
    },
    input: {
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
    },
    inputPressed: {
      backgroundColor: theme.rowPressedBg,
    },
    inputText: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    inputTextMuted: {
      color: theme.textMuted,
    },
  });
}
