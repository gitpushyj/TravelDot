import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { getCurrentLocale } from "../../../i18n";
import { MAP_PALETTES, type MapPalette } from "../../../theme/mapPalettes";
import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";
import PalettePicker from "../../MapAppearanceScreen/PalettePicker";
import MiniDotMap from "./MiniDotMap";
import SlideFrame from "./SlideFrame";

// 지도 스타일 소개 슬라이드. 팔레트를 고르면 위쪽 미니 월드맵이 그 색으로
// 바뀌어, 구독 시 지도가 어떻게 달라지는지 직접 보여준다.
export default function MapStyleSlide() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isKo = getCurrentLocale() === "ko";
  // PalettePicker/도트 지도가 어느 모드 기준으로 색을 보여줄지 — 현재 앱 테마와 맞춤.
  const previewMode: "light" | "dark" = theme.statusBar === "light" ? "dark" : "light";

  const [selectedId, setSelectedId] = useState("green");
  const [contentWidth, setContentWidth] = useState(0);

  const labelOf = (p: MapPalette) => (isKo ? p.labelKo : p.labelEn);
  const selectedPalette =
    MAP_PALETTES.find((p) => p.id === selectedId) ?? MAP_PALETTES[0];

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== contentWidth) setContentWidth(w);
  };

  // preview 카드의 좌우 padding(12*2)을 뺀 너비를 미니 지도에 넘긴다.
  const mapWidth = contentWidth > 0 ? contentWidth - 24 : 0;

  return (
    <SlideFrame
      icon="🎨"
      iconBg="#efddff"
      title={t("premiumIntro.slides.mapStyle.title")}
      desc={t("premiumIntro.slides.mapStyle.desc")}
    >
      <View style={styles.wrap} onLayout={onLayout}>
        <View style={styles.preview}>
          {mapWidth > 0 ? (
            <MiniDotMap
              width={mapWidth}
              palette={selectedPalette}
              mode={previewMode}
            />
          ) : null}
        </View>
        <PalettePicker
          theme={theme}
          previewMode={previewMode}
          currentId={selectedId}
          labelOf={labelOf}
          onSelect={setSelectedId}
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
    preview: {
      backgroundColor: theme.homeBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      padding: 12,
      alignItems: "center",
    },
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
