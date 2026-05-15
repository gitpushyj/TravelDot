import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Flag } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";
import { GameCard } from "./GameCard";

export default function GamesHubScreen({
  onClose,
  onOpenFlagQuiz,
}: {
  onClose: () => void;
  onOpenFlagQuiz: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.homeBg }} edges={["top", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Pressable onPress={onClose} hitSlop={10} style={{ padding: 8 }}>
          <ChevronLeft color={theme.textPrimary} size={26} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "800", color: theme.textPrimary }}>
          {t("gamesHub.title")}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <GameCard
          icon={Flag}
          title={t("gamesHub.flagQuizTitle")}
          description={t("gamesHub.flagQuizDesc")}
          onPress={onOpenFlagQuiz}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
