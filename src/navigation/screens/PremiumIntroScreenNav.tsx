import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import PremiumIntroScreen from "../../screens/PremiumIntroScreen";
import {
  trackPremiumIntroDismissed,
  trackPremiumIntroViewed,
} from "../../lib/analyticsEvents";
import { useTheme } from "../../theme/themeStore";
import type { RootStackParamList } from "../types";

export default function PremiumIntroScreenNav({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "PremiumIntro">) {
  const theme = useTheme();
  const returnToTab = route.params?.returnToTab;
  // 어떤 진입점(settings/milestones/ai_tab 등)에서 시작했는지는 premium_intro_viewed에
  // 별도 파라미터로 보내지 않는다 — PremiumIntro는 마운트 자체가 funnel의 한 단계라
  // 이미 source별 비율은 directly 진입한 paywall_viewed와 비교해서 추론 가능하다.
  useEffect(() => {
    trackPremiumIntroViewed();
  }, []);

  return (
    <>
      <StatusBar style={theme.statusBar} />
      <PremiumIntroScreen
        onGoToSubscription={() => {
          // returnToTab을 그대로 Subscription에 넘긴다.
          // Subscription paywall source는 항상 premium_intro로 일관 — 사용자가 마지막으로
          // 본 화면이 premium_intro이기 때문. 어떤 진입점에서 시작했는지는 introSource로
          // 보고된 premium_intro_viewed에 이미 보존돼 있다.
          navigation.replace("Subscription", {
            ...(returnToTab ? { returnToTab } : {}),
            analyticsSource: "premium_intro",
          });
        }}
        onDismiss={() => {
          trackPremiumIntroDismissed();
          if (returnToTab) {
            navigation.navigate("Main", { screen: returnToTab });
          } else {
            navigation.goBack();
          }
        }}
      />
    </>
  );
}

