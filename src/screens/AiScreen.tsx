import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { useTheme } from "../theme/themeStore";

export default function AiScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();
  return (
    <View style={[styles.root, { paddingBottom: bottomInset }]}>
      <Text style={styles.title}>AI</Text>
    </View>
  );
}

function makeStyles(theme: { homeBg: string; textPrimary: string }) {
  return StyleSheet.create({
    root: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.homeBg,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.textPrimary,
    },
  });
}
