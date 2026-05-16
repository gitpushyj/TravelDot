import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useScreenBottomInset } from "../hooks/useScreenInsets";
import type { PlanId } from "../features/subscription/plans";
import { usePlans } from "../features/subscription/usePlans";
import { useSubscription } from "../features/subscription/useSubscription";
import {
  PaywallSource,
  trackPaywallPlanSelected,
  trackPaywallViewed,
  trackRestoreAttempted,
  trackRestoreResult,
  trackSubscribeAttempted,
  trackSubscribeFailed,
  trackSubscribeSucceeded,
} from "../lib/analyticsEvents";
import { logPurchase } from "../lib/tracking";
import { useTheme } from "../theme/themeStore";

import ContinueButton from "./SubscriptionScreen/ContinueButton";
import FeatureGrid from "./SubscriptionScreen/FeatureGrid";
import FooterDisclaimer from "./SubscriptionScreen/FooterDisclaimer";
import HeroDotMap from "./SubscriptionScreen/HeroDotMap";
import LegalLinks from "./SubscriptionScreen/LegalLinks";
import PlanCard from "./SubscriptionScreen/PlanCard";
import RestoreLink from "./SubscriptionScreen/RestoreLink";
import { makeStyles } from "./SubscriptionScreen/styles";

type Props = {
  onClose: () => void;
  // paywall_viewed/subscribe_* 이벤트에 어디서 들어왔는지 기록한다.
  source?: PaywallSource;
};

// "Get Unlimited Access" 화면. tier 0(free) 사용자에게만 노출되며
// Continue 누르면 useSubscription.subscribe()로 tier를 1(premium)로 올린다.
export default function SubscriptionScreen({ onClose, source = "unknown" }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();

  const { isSubscribed, loading, subscribe, restore } = useSubscription();
  const { plans } = usePlans();
  const [selected, setSelected] = useState<PlanId>("yearly");

  // 마운트 1회 paywall_viewed. yearly가 default selected라 plan_selected는
  // 사용자가 명시적으로 토글했을 때만 발화한다.
  useEffect(() => {
    trackPaywallViewed(source);
  }, [source]);

  const selectPlan = (plan: PlanId) => {
    if (selected === plan) return;
    setSelected(plan);
    trackPaywallPlanSelected({ source, plan });
  };

  const handleContinue = async () => {
    if (isSubscribed) {
      onClose();
      return;
    }
    trackSubscribeAttempted({ source, plan: selected });
    try {
      await subscribe(selected);
      trackSubscribeSucceeded({ source, plan: selected });
      // Firebase 표준 purchase 이벤트. RC SDK가 가격 정보를 영수증으로부터
      // 받아오지만, 결제 직후 customerInfo에는 가격이 포함되지 않으므로 화면에
      // 표시 중인 product price를 그대로 사용한다. 정확한 매출은 RC/스토어 콘솔이
      // 권위 출처이며, 여기서 보내는 값은 Firebase 안에서의 funnel 비교용.
      const selectedPlan = selected === "yearly" ? plans.yearly : plans.monthly;
      const priceNumber = Number(
        selectedPlan.priceLabel.replace(/[^\d.,]/g, "").replace(",", ".")
      );
      if (Number.isFinite(priceNumber) && priceNumber > 0) {
        logPurchase({
          value: priceNumber,
          currency: "USD",
          itemId: selected,
          itemName: `subscription_${selected}`,
        });
      }
      onClose();
    } catch (e) {
      trackSubscribeFailed({ source, plan: selected, reason: String(e) });
      Alert.alert(t("subscription.error.title"), String(e));
    }
  };

  const handleRestore = async () => {
    trackRestoreAttempted();
    try {
      const restored = await restore();
      trackRestoreResult(restored);
      Alert.alert(
        t("subscription.restore.label"),
        restored
          ? t("subscription.restore.success")
          : t("subscription.restore.notFound")
      );
      if (restored) onClose();
    } catch (e) {
      Alert.alert(t("subscription.error.title"), String(e));
    }
  };

  const yearly = plans.yearly;
  const monthly = plans.monthly;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <HeroDotMap theme={theme} brand={t("subscription.brand")} />

        <View style={styles.contentWrap}>
          <Text style={styles.heading}>
            {t("subscription.heading.prefix")}{" "}
            <Text style={styles.headingAccent}>
              {t("subscription.heading.highlight")}
            </Text>
            {t("subscription.heading.suffix")
              ? ` ${t("subscription.heading.suffix")}`
              : ""}
          </Text>
          <Text style={styles.subheading}>{t("subscription.subheading")}</Text>

          <View style={styles.featureWrap}>
            <FeatureGrid theme={theme} />
          </View>

          <View style={styles.plansWrap}>
            <PlanCard
              theme={theme}
              selected={selected === "yearly"}
              onPress={() => selectPlan("yearly")}
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
              selected={selected === "monthly"}
              onPress={() => selectPlan("monthly")}
              title={t("subscription.plan.monthly.title")}
              rightPrimary={monthly.priceLabel}
              rightSecondary={t("subscription.perMonth")}
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
        <View style={{ height: 8 }} />
        <LegalLinks
          theme={theme}
          privacyLabel={t("subscription.legal.privacyPolicy")}
          termsLabel={t("subscription.legal.termsOfUse")}
        />
        <View style={{ height: 6 }} />
        <RestoreLink
          theme={theme}
          label={t("subscription.restore.label")}
          disabled={loading}
          onPress={handleRestore}
        />
      </View>
    </View>
  );
}
