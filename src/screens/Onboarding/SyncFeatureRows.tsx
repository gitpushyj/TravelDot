import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import type { Theme } from "../../theme/theme";

import SyncFeatureRow from "./SyncFeatureRow";
import {
  PhotoSyncIcon,
  ShieldSyncIcon,
  TrashSyncIcon,
} from "./syncFeatureIcons";

type Props = { theme: Theme };

// 3-행 카드. 각 행은 색상 톤이 다른 아이콘으로 정보 카테고리를 구분한다.
// 색은 의미별로 고정한다: 주황(자동 기능), 녹(보안), 청(설정/제어).
const PHOTO_BG = "rgba(255,107,53,0.14)";
const PHOTO_FG = "#ff6b35";
const SHIELD_BG = "rgba(34,197,94,0.14)";
const SHIELD_FG = "#22c55e";
const TRASH_BG = "rgba(59,130,246,0.14)";
const TRASH_FG = "#3b82f6";

export default function SyncFeatureRows({ theme }: Props) {
  const { t } = useTranslation();
  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <SyncFeatureRow
        theme={theme}
        Icon={PhotoSyncIcon}
        iconBg={PHOTO_BG}
        iconColor={PHOTO_FG}
        title={t("onboarding.sync.feature1.title")}
        desc={t("onboarding.sync.feature1.desc")}
      />
      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
      <SyncFeatureRow
        theme={theme}
        Icon={ShieldSyncIcon}
        iconBg={SHIELD_BG}
        iconColor={SHIELD_FG}
        title={t("onboarding.sync.feature2.title")}
        desc={t("onboarding.sync.feature2.desc")}
        descEmphasis={t("onboarding.sync.feature2.descEmphasis")}
      />
      <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
      <SyncFeatureRow
        theme={theme}
        Icon={TrashSyncIcon}
        iconBg={TRASH_BG}
        iconColor={TRASH_FG}
        title={t("onboarding.sync.feature3.title")}
        desc={t("onboarding.sync.feature3.desc")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  divider: {
    height: 1,
  },
});
