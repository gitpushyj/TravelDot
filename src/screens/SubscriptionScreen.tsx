import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { PLANS, type PlanId } from "../features/subscription/plans";
import { useSubscription } from "../features/subscription/useSubscription";
import { useTheme } from "../theme/themeStore";

import ContinueButton from "./SubscriptionScreen/ContinueButton";
import FooterDisclaimer from "./SubscriptionScreen/FooterDisclaimer";
import HeroCollage from "./SubscriptionScreen/HeroCollage";
import PlanCard from "./SubscriptionScreen/PlanCard";
import { makeStyles } from "./SubscriptionScreen/styles";

type Props = {
  onClose: () => void;
};

// "Get Unlimited Access" 화면. tier 0(free) 사용자에게만 노출되며
// Continue 누르면 useSubscription.subscribe()로 tier를 1(premium)로 올린다.
export default function SubscriptionScreen({ onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();

  const { isSubscribed, loading, subscribe } = useSubscription();
  const [selected, setSelected] = useState<PlanId>("yearly");

  const handleContinue = async () => {
    if (isSubscribed) {
      onClose();
      return;
    }
    try {
      await subscribe(selected);
      onClose();
    } catch (e) {
      Alert.alert(t("subscription.error.title"), String(e));
    }
  };

  const yearly = PLANS.yearly;
  const weekly = PLANS.weekly;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <HeroCollage theme={theme} brand={t("subscription.brand")} />

        <View style={styles.contentWrap}>
          <Text style={styles.heading}>
            {t("subscription.heading.prefix")}{" "}
            <Text style={styles.headingAccent}>
              {t("subscription.heading.highlight")}
            </Text>{" "}
            {t("subscription.heading.suffix")}
          </Text>
          <Text style={styles.subheading}>{t("subscription.subheading")}</Text>

          <View style={styles.plansWrap}>
            <PlanCard
              theme={theme}
              selected={selected === "yearly"}
              onPress={() => setSelected("yearly")}
              title={t("subscription.plan.yearly.title")}
              periodLabel={t("subscription.plan.yearly.period", {
                price: yearly.priceLabel,
              })}
              rightPrimary={yearly.perWeekLabel}
              rightSecondary={t("subscription.perWeek")}
              trialLabel={
                yearly.freeTrialDays > 0
                  ? t("subscription.freeTrial", {
                      days: yearly.freeTrialDays,
                    })
                  : undefined
              }
              saveLabel={
                yearly.savePercent > 0
                  ? t("subscription.save", { percent: yearly.savePercent })
                  : undefined
              }
            />
            <PlanCard
              theme={theme}
              selected={selected === "weekly"}
              onPress={() => setSelected("weekly")}
              title={t("subscription.plan.weekly.title")}
              rightPrimary={weekly.priceLabel}
              rightSecondary={t("subscription.perWeek")}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 24 }]}>
        <ContinueButton
          theme={theme}
          label={t(
            isSubscribed
              ? "subscription.continue.alreadySubscribed"
              : "subscription.continue.label"
          )}
          loading={loading}
          onPress={handleContinue}
        />
        <FooterDisclaimer
          theme={theme}
          text={
            selected === "yearly" && yearly.freeTrialDays > 0
              ? t("subscription.disclaimer.trial", {
                  days: yearly.freeTrialDays,
                })
              : t("subscription.disclaimer.regular")
          }
        />
      </View>
    </View>
  );
}
