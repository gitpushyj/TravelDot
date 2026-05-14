import React, { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Cloud, CloudUpload, RefreshCw, RotateCcw } from "lucide-react-native";

import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";

// 기기 동기화 슬라이드.
// - 상단: 클라우드 아이콘 + 타이틀(액센트 강조) + 부제
// - 중앙 hero: 클라우드 → 폰/노트북/태블릿 일러스트 이미지
// - 하단: 자동 백업 / 기기 동기화 / 새 기기 복원 3개 feature 카드
const HERO_IMAGE = require("../../../../assets/premium-intro-device-sync.png");
const HERO_ASPECT = 1024 / 1536; // 원본 PNG 비율 (height / width)
const SLIDE_PADDING_H = 24;

export default function DeviceSyncSlide() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // RN Image는 require된 원본 크기로 부풀어 오르는 경향이 있어, hero wrapper의
  // 크기를 명시적으로 잡아 비율에 맞춰 그리도록 한다.
  const heroWidth = screenWidth - SLIDE_PADDING_H * 2;
  const heroHeight = heroWidth * HERO_ASPECT;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.iconBox}>
        <Cloud size={26} color={theme.accent} strokeWidth={2} />
      </View>

      <Text style={styles.title}>
        {t("premiumIntro.slides.deviceSync.titleMain")}{" "}
        <Text style={styles.titleAccent}>
          {t("premiumIntro.slides.deviceSync.titleAccent")}
        </Text>
      </Text>
      <Text style={styles.subtitle}>
        {t("premiumIntro.slides.deviceSync.subtitle")}
      </Text>

      <View
        style={[
          styles.heroWrap,
          { width: heroWidth, height: heroHeight },
        ]}
      >
        <Image source={HERO_IMAGE} style={styles.heroImage} resizeMode="cover" />
      </View>

      <View style={styles.features}>
        <FeatureRow
          icon={<CloudUpload size={22} color={theme.accent} strokeWidth={2.2} />}
          label={t("premiumIntro.slides.deviceSync.feature.backupLabel")}
          sub={t("premiumIntro.slides.deviceSync.feature.backupSub")}
          styles={styles}
        />
        <View style={styles.featureDivider} />
        <FeatureRow
          icon={<RefreshCw size={22} color={theme.accent} strokeWidth={2.2} />}
          label={t("premiumIntro.slides.deviceSync.feature.syncLabel")}
          sub={t("premiumIntro.slides.deviceSync.feature.syncSub")}
          styles={styles}
        />
        <View style={styles.featureDivider} />
        <FeatureRow
          icon={<RotateCcw size={22} color={theme.accent} strokeWidth={2.2} />}
          label={t("premiumIntro.slides.deviceSync.feature.restoreLabel")}
          sub={t("premiumIntro.slides.deviceSync.feature.restoreSub")}
          styles={styles}
        />
      </View>
    </ScrollView>
  );
}

function FeatureRow({
  icon,
  label,
  sub,
  styles,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconWrap}>{icon}</View>
      <View style={styles.featureTextCol}>
        <Text style={styles.featureLabel}>{label}</Text>
        <Text style={styles.featureSub}>{sub}</Text>
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: SLIDE_PADDING_H,
      paddingTop: 12,
      paddingBottom: 16,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: theme.accentSoftBg,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: theme.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      lineHeight: 30,
      marginTop: 12,
    },
    titleAccent: {
      color: theme.accent,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
    },
    heroWrap: {
      marginTop: 12,
      borderRadius: 16,
      overflow: "hidden",
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    features: {
      marginTop: 12,
      backgroundColor: theme.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingHorizontal: 12,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    },
    featureIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accentSoftBg,
      alignItems: "center",
      justifyContent: "center",
    },
    featureTextCol: {
      flex: 1,
      gap: 2,
    },
    featureLabel: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },
    featureSub: {
      color: theme.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },
    featureDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.cardBorder,
    },
  });
}
