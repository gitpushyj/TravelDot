import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import DotMap from "../components/DotMap";
import { useScreenBottomInset } from "../hooks/useScreenInsets";
import { getCurrentLocale } from "../i18n";
import type { MapPalette } from "../theme/mapPalettes";
import { useMapTheme, useTheme, useThemeStore } from "../theme/themeStore";

import PalettePicker from "./MapAppearanceScreen/PalettePicker";
import { makeStyles } from "./MapAppearanceScreen/styles";

type Props = {
  onClose: () => void;
};

export default function MapAppearanceScreen({ onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const mapTheme = useMapTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const bottomInset = useScreenBottomInset();

  // 도트맵 핀치/팬 중에는 부모 ScrollView 세로 스크롤을 잠가 손가락 충돌을 막는다.
  const [mapInteracting, setMapInteracting] = useState(false);

  const mapPaletteId = useThemeStore((s) => s.mapPaletteId);
  const setMapPaletteId = useThemeStore((s) => s.setMapPaletteId);

  const labelOf = (palette: MapPalette) => {
    const locale = getCurrentLocale();
    if (locale === "ko") return palette.labelKo;
    return palette.labelEn;
  };

  return (
    <View style={[styles.root, { paddingBottom: bottomInset }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.cancel}>{t("common.close")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("mapAppearance.title")}</Text>
        <View style={{ minWidth: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        scrollEnabled={!mapInteracting}
      >
        <View style={styles.mapPreviewWrap}>
          <DotMap
            enableZoom
            playIntro={false}
            mapAreaStyle={styles.mapPreview}
            onInteractingChange={setMapInteracting}
          />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t("mapAppearance.section.palette")}
        </Text>
        <PalettePicker
          theme={theme}
          previewMode={mapTheme.mode}
          currentId={mapPaletteId}
          labelOf={labelOf}
          onSelect={(id) => void setMapPaletteId(id)}
        />
      </ScrollView>
    </View>
  );
}
