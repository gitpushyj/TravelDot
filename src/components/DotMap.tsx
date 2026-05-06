import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Canvas, Group, RoundedRect } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";

import dotData from "../../assets/data/dots.json";
import { useVisitStore } from "../features/travel/visitStore";
import type { CountryRef, DotData } from "../types";
import { colorForVisit } from "../utils/heatmap";

const FILL_RATIO = 0.6;
const MIN_SCALE = 1;
const MAX_SCALE = 10;
const HIGHLIGHT_COLOR = "#ffd75e";

type Props = {
  visitCounts?: Record<string, number>;
  // pinch/pan 활성화 여부. 홈에서는 ScrollView와 충돌을 피하려고 false.
  enableZoom?: boolean;
};

export default function DotMap({
  visitCounts: visitCountsProp,
  enableZoom = true,
}: Props) {
  const { dots, gridSize, minLat, maxLat } = dotData as DotData;
  const [size, setSize] = useState({ width: 0, height: 0 });
  // 한 도트가 여러 나라에 걸쳐 있을 때만 사용하는 임시 선택지.
  const [pending, setPending] = useState<CountryRef[] | null>(null);
  const storeVisitCounts = useVisitStore((s) => s.visitCounts);
  const visitCounts = visitCountsProp ?? storeVisitCounts;
  const homeCountry = useVisitStore((s) => s.homeCountry);
  const selectedCountry = useVisitStore((s) => s.selectedCountry);
  const setSelectedCountry = useVisitStore((s) => s.setSelectedCountry);

  const viewBoxW = 360;
  const drawWidth = size.width;
  const baseScale = drawWidth / viewBoxW || 1;

  const dotPx = gridSize * FILL_RATIO * baseScale;
  const halfDotPx = dotPx / 2;
  const radius = dotPx * 0.25;

  const homeCode = homeCountry?.code;
  const positioned = useMemo(
    () =>
      dots.map((d) => {
        const fallback: CountryRef[] = d.country
          ? [{ code: d.country, name: d.name ?? d.country }]
          : [];
        const countries =
          d.countries && d.countries.length ? d.countries : fallback;
        const primary = countries[0]?.code;
        const isHome = primary != null && primary === homeCode;
        const count = primary ? visitCounts[primary] ?? 0 : 0;
        return {
          id: d.id,
          x: (d.lng + 180) * baseScale - halfDotPx,
          y: (maxLat - d.lat) * baseScale - halfDotPx,
          countries,
          fill: colorForVisit({ count, isHomeCountry: isHome }),
        };
      }),
    [dots, baseScale, halfDotPx, maxLat, visitCounts, homeCode]
  );

  const highlightedIds = useMemo(() => {
    if (!selectedCountry) return null;
    const ids = new Set<string>();
    for (const d of positioned) {
      if (d.countries.some((c) => c.code === selectedCountry.code)) {
        ids.add(d.id);
      }
    }
    return ids;
  }, [positioned, selectedCountry]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onUpdate((e) => {
      const newScale = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      const r = newScale / savedScale.value;
      tx.value = focalX.value * (1 - r) + savedTx.value * r;
      ty.value = focalY.value * (1 - r) + savedTy.value * r;
      scale.value = newScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const onTap = useCallback(
    (worldX: number, worldY: number) => {
      const cellPx = gridSize * baseScale;
      const hitR = cellPx * 0.75;
      const hitR2 = hitR * hitR;
      let bestCountries: CountryRef[] | null = null;
      let bestDist = Infinity;
      for (const d of positioned) {
        const cx = d.x + halfDotPx;
        const cy = d.y + halfDotPx;
        const dx = worldX - cx;
        const dy = worldY - cy;
        const dist = dx * dx + dy * dy;
        if (dist < hitR2 && dist < bestDist) {
          bestCountries = d.countries;
          bestDist = dist;
        }
      }
      if (!bestCountries || bestCountries.length === 0) return;
      if (bestCountries.length === 1) {
        const c = bestCountries[0];
        setPending(null);
        setSelectedCountry({ code: c.code, name: c.name });
      } else {
        setPending(bestCountries);
      }
    },
    [positioned, halfDotPx, baseScale, gridSize, setSelectedCountry]
  );

  const tap = Gesture.Tap()
    .maxDistance(8)
    .onEnd((e) => {
      const wx = (e.x - tx.value) / scale.value;
      const wy = (e.y - ty.value) / scale.value;
      runOnJS(onTap)(wx, wy);
    });

  const composed = enableZoom
    ? Gesture.Race(tap, Gesture.Simultaneous(pinch, pan))
    : tap;

  const transform = useDerivedValue(() => [
    { translateX: tx.value },
    { translateY: ty.value },
    { scale: scale.value },
  ]);

  return (
    <View style={styles.root}>
      <View
        style={styles.mapArea}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width !== size.width || height !== size.height) {
            setSize({ width, height });
          }
        }}
      >
        {size.width > 0 && (
          <GestureDetector gesture={composed}>
            <Canvas style={{ width: size.width, height: size.height }}>
              <Group transform={transform}>
                {positioned.map((d) => (
                  <RoundedRect
                    key={d.id}
                    x={d.x}
                    y={d.y}
                    width={dotPx}
                    height={dotPx}
                    r={radius}
                    color={
                      highlightedIds?.has(d.id) ? HIGHLIGHT_COLOR : d.fill
                    }
                  />
                ))}
              </Group>
            </Canvas>
          </GestureDetector>
        )}
      </View>
      {pending && pending.length > 0 && (
        <View style={styles.caption}>
          <Text style={styles.captionLabel}>
            어느 나라의 도트를 강조할까요?
          </Text>
          <View style={styles.optionRow}>
            {pending.map((c) => (
              <Pressable
                key={c.code}
                style={({ pressed }) => [
                  styles.optionBtn,
                  pressed && styles.optionBtnPressed,
                ]}
                onPress={() => {
                  setSelectedCountry({ code: c.code, name: c.name });
                  setPending(null);
                }}
              >
                <Text style={styles.optionText}>{c.name}</Text>
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [
                styles.optionBtn,
                pressed && styles.optionBtnPressed,
              ]}
              onPress={() => setPending(null)}
            >
              <Text style={styles.optionText}>취소</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function clamp(v: number, min: number, max: number) {
  "worklet";
  return Math.max(min, Math.min(max, v));
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mapArea: {
    width: "100%",
    aspectRatio: 360 / 145,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  caption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  captionLabel: {
    color: "#8a8779",
    fontSize: 12,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ecebe4",
  },
  optionBtnPressed: {
    backgroundColor: "#f3efe6",
  },
  optionText: {
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "600",
  },
});
