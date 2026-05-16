import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BarChart3,
  ChevronLeft,
  Flag,
  Globe2,
  ListChecks,
  Star,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";
import { GameCard, type GameCardPalette } from "./GameCard";
import { GamesHubIntro } from "./GamesHubIntro";
import { useGamesHubScores } from "./useGamesHubScores";

const FLAG_QUIZ_QUESTIONS = 50;
const TRIVIA_QUESTIONS = 100;

export default function GamesHubScreen({
  onClose,
  onOpenFlagQuiz,
  onOpenTravelTrivia,
}: {
  onClose: () => void;
  onOpenFlagQuiz: () => void;
  onOpenTravelTrivia: () => void;
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const scores = useGamesHubScores();

  const flagPalette: GameCardPalette = useMemo(
    () => ({
      bg: theme.gameCardFlagBg,
      accent: theme.gameCardFlagAccent,
      accentText: "#ffffff",
      separator: theme.gameCardSeparator,
      titleText: theme.textPrimary,
      statLabel: theme.textSecondary,
      statValue: theme.textPrimary,
    }),
    [theme],
  );
  const triviaPalette: GameCardPalette = useMemo(
    () => ({
      bg: theme.gameCardTriviaBg,
      accent: theme.gameCardTriviaAccent,
      accentText: "#ffffff",
      separator: theme.gameCardSeparator,
      titleText: theme.textPrimary,
      statLabel: theme.textSecondary,
      statValue: theme.textPrimary,
    }),
    [theme],
  );

  const fmt = useMemo(() => new Intl.NumberFormat(i18n.language), [i18n.language]);
  const display = (score: number | null) =>
    score == null || score <= 0 ? t("gamesHub.emptyScore") : fmt.format(score);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.homeBg }}
      edges={["top", "bottom"]}
    >
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
      <ScrollView contentContainerStyle={{ paddingBottom: 24, gap: 16 }}>
        <GamesHubIntro />
        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          <GameCard
            palette={flagPalette}
            illustration={require("../../../assets/game_earth.png")}
            badgeIcon={Flag}
            badgeLabel={t("gamesHub.flagQuizTitle")}
            title={t("gamesHub.flagQuizHeading")}
            stats={[
              {
                icon: Star,
                label: t("gamesHub.topScore"),
                value: display(scores.flagTop),
              },
              {
                icon: BarChart3,
                label: t("gamesHub.myBestScore"),
                value: display(scores.flagMyBest),
              },
              {
                icon: ListChecks,
                label: t("gamesHub.questionCount"),
                value: fmt.format(FLAG_QUIZ_QUESTIONS),
              },
            ]}
            ctaLabel={t("gamesHub.play")}
            onPress={onOpenFlagQuiz}
          />
          <GameCard
            palette={triviaPalette}
            illustration={require("../../../assets/game_passport.png")}
            badgeIcon={Globe2}
            badgeLabel={t("gamesHub.triviaTitle")}
            title={t("gamesHub.triviaHeading")}
            stats={[
              {
                icon: Star,
                label: t("gamesHub.topScore"),
                value: display(scores.triviaTop),
              },
              {
                icon: BarChart3,
                label: t("gamesHub.myBestScore"),
                value: display(scores.triviaMyBest),
              },
              {
                icon: ListChecks,
                label: t("gamesHub.questionCount"),
                value: fmt.format(TRIVIA_QUESTIONS),
              },
            ]}
            ctaLabel={t("gamesHub.challenge")}
            onPress={onOpenTravelTrivia}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
