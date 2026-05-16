import { Image, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../theme/themeStore";

// 게임 허브 상단 인트로 — 좌측 타이틀/부제 + 우측 트로피 일러스트.
export function GamesHubIntro() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 8,
      }}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: theme.textPrimary,
            lineHeight: 30,
          }}
        >
          {t("gamesHub.introTitle")}
        </Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary }}>
          {t("gamesHub.introSubtitle")}
        </Text>
      </View>
      <Image
        source={require("../../../assets/game_tropi.png")}
        style={{ width: 220, height: 220 }}
        resizeMode="contain"
      />
    </View>
  );
}
