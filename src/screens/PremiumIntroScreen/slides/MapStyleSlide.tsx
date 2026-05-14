import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { getCurrentLocale } from "../../../i18n";
import type { MapPalette } from "../../../theme/mapPalettes";
import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";
import PalettePicker from "../../MapAppearanceScreen/PalettePicker";
import SlideFrame from "./SlideFrame";

// 지도 스타일 소개 슬라이드. 실제 PalettePicker를 재사용하되
// 선택 콜백은 no-op (보여주기용).
export default function MapStyleSlide() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isKo = getCurrentLocale() === "ko";

  const labelOf = (palette: MapPalette) => (isKo ? palette.labelKo : palette.labelEn);
  const previewMode: "light" | "dark" = theme.statusBar === "light" ? "dark" : "light";

  return (
    <SlideFrame
      icon="🎨"
      iconBg="#efddff"
      title={t("premiumIntro.slides.mapStyle.title")}
      desc={t("premiumIntro.slides.mapStyle.desc")}
    >
      <View style={styles.wrap}>
        <PalettePicker
          theme={theme}
          previewMode={previewMode}
          currentId="green"
          labelOf={labelOf}
          onSelect={() => {}}
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {t("premiumIntro.slides.mapStyle.premiumOnly")}
          </Text>
        </View>
      </View>
    </SlideFrame>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    wrap: { gap: 14 },
    badge: {
      alignSelf: "center",
      backgroundColor: theme.accent,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: {
      color: theme.accentOn,
      fontSize: 11,
      fontWeight: "700",
    },
  });
}
