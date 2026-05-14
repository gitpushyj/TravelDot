import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { MAP_PALETTES, type MapPalette } from "../../../theme/mapPalettes";
import type { Theme } from "../../../theme/theme";
import { useTheme } from "../../../theme/themeStore";
import { GRID_COLS, GRID_ROWS } from "./miniWorldGrid";
import MiniDotMap from "./MiniDotMap";
import SlideFrame from "./SlideFrame";

// 4개의 미니 월드맵을 각기 다른 팔레트로 보여주어, 구독 시 지도를 어떤 톤으로
// 꾸밀 수 있는지 한눈에 전달한다.
const PREVIEW_IDS = ["green", "blue", "purple", "orange"] as const;
const CARD_GAP = 10;
const CARD_PAD_V = 8;
const CARD_PAD_H = 12;

export default function MapStyleSlide() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const previewMode: "light" | "dark" = theme.statusBar === "light" ? "dark" : "light";

  const [box, setBox] = useState({ w: 0, h: 0 });

  const palettes = useMemo<MapPalette[]>(
    () =>
      PREVIEW_IDS.map(
        (id) => MAP_PALETTES.find((p) => p.id === id) ?? MAP_PALETTES[0],
      ),
    [],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== box.w || height !== box.h) setBox({ w: width, h: height });
  };

  // 4장 카드 + 3개 gap이 세로로 들어가야 한다. 카드 내부 padding을 빼면 미니맵
  // 최대 높이가 정해지고, 그에 맞춰 grid 비율로 가로폭을 계산한다.
  const perCardH = box.h > 0 ? (box.h - CARD_GAP * 3) / 4 : 0;
  const mapH = Math.max(0, perCardH - CARD_PAD_V * 2);
  const widthByHeight = (mapH * GRID_COLS) / GRID_ROWS;
  const widthByContainer = Math.max(0, box.w - CARD_PAD_H * 2);
  const mapWidth = Math.floor(Math.min(widthByHeight, widthByContainer));

  return (
    <SlideFrame
      icon="🎨"
      iconBg="#efddff"
      title={t("premiumIntro.slides.mapStyle.title")}
      desc={t("premiumIntro.slides.mapStyle.desc")}
    >
      <View style={styles.list} onLayout={onLayout}>
        {palettes.map((palette) => (
          <View key={palette.id} style={styles.card}>
            {mapWidth > 0 ? (
              <MiniDotMap width={mapWidth} palette={palette} mode={previewMode} />
            ) : null}
          </View>
        ))}
      </View>
    </SlideFrame>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    list: {
      flex: 1,
      gap: CARD_GAP,
      justifyContent: "center",
    },
    card: {
      flex: 1,
      backgroundColor: theme.homeBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      paddingVertical: CARD_PAD_V,
      paddingHorizontal: CARD_PAD_H,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
