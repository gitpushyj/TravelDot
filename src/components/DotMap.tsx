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
import type { CountryRef, DotData } from "../types";
import { BG_COLOR, colorForVisitCount } from "../utils/heatmap";

const FILL_RATIO = 0.6;
const MIN_SCALE = 1;
const MAX_SCALE = 10;
const HIGHLIGHT_COLOR = "#ffd75e";

type Props = { visitCounts?: Record<string, number> };

type Selection =
  | { kind: "none" }
  | { kind: "pending"; options: CountryRef[] }
  | { kind: "country"; code: string; name: string };

function clamp(v: number, min: number, max: number) {
  "worklet";
  return Math.max(min, Math.min(max, v));
}

export default function DotMap({ visitCounts }: Props) {
  const { dots, gridSize, minLat, maxLat } = dotData as DotData;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [selection, setSelection] = useState<Selection>({ kind: "none" });

  const viewBoxW = 360;
  const viewBoxH = maxLat - minLat;

  // 가로는 화면 폭에 꽉 맞추고, 세로는 비율에 따라 결정한다.
  const drawWidth = size.width;
  const baseScale = drawWidth / viewBoxW || 1;

  const dotPx = gridSize * FILL_RATIO * baseScale;
  const halfDotPx = dotPx / 2;
  const radius = dotPx * 0.25;

  const positioned = useMemo(
    () =>
      dots.map((d) => {
        const fallback: CountryRef[] = d.country
          ? [{ code: d.country, name: d.name ?? d.country }]
          : [];
        return {
          id: d.id,
          x: (d.lng + 180) * baseScale - halfDotPx,
          y: (maxLat - d.lat) * baseScale - halfDotPx,
          countries: d.countries && d.countries.length ? d.countries : fallback,
          fill: colorForVisitCount(visitCounts?.[d.id] ?? 0),
        };
      }),
    [dots, baseScale, halfDotPx, maxLat, visitCounts]
  );

  const highlightedIds = useMemo(() => {
    if (selection.kind !== "country") return null;
    const ids = new Set<string>();
    for (const d of positioned) {
      if (d.countries.some((c) => c.code === selection.code)) ids.add(d.id);
    }
    return ids;
  }, [positioned, selection]);

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
      // 격자 한 칸 크기를 기준으로 hit 영역을 잡으면 도트 사이 여백(특히
      // 4개 도트 사이의 대각선 코너)까지 모두 커버된다. 코너에서 가장 가까운
      // 도트 중심까지 거리는 약 0.707셀이므로 0.75셀이면 여유 있게 덮는다.
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
      if (!bestCountries || bestCountries.length === 0) {
        setSelection({ kind: "none" });
      } else if (bestCountries.length === 1) {
        const c = bestCountries[0];
        setSelection({ kind: "country", code: c.code, name: c.name });
      } else {
        setSelection({ kind: "pending", options: bestCountries });
      }
    },
    [positioned, halfDotPx]
  );

  const tap = Gesture.Tap()
    .maxDistance(8)
    .onEnd((e) => {
      const wx = (e.x - tx.value) / scale.value;
      const wy = (e.y - ty.value) / scale.value;
      runOnJS(onTap)(wx, wy);
    });

  const composed = Gesture.Race(tap, Gesture.Simultaneous(pinch, pan));

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
      <View style={styles.caption}>
        {selection.kind === "pending" ? (
          <>
            <Text style={styles.captionLabel}>
              어느 나라의 도트를 강조할까요?
            </Text>
            <View style={styles.optionRow}>
              {selection.options.map((c) => (
                <Pressable
                  key={c.code}
                  style={({ pressed }) => [
                    styles.optionBtn,
                    pressed && styles.optionBtnPressed,
                  ]}
                  onPress={() =>
                    setSelection({
                      kind: "country",
                      code: c.code,
                      name: c.name,
                    })
                  }
                >
                  <Text style={styles.optionText}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : selection.kind === "country" ? (
          <>
            <Text style={styles.captionLabel}>
              {selection.name} · {highlightedIds?.size ?? 0}개 도트
            </Text>
            <Pressable
              onPress={() => setSelection({ kind: "none" })}
              hitSlop={6}
            >
              <Text style={styles.clearText}>선택 해제</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.captionHint}>
            도트를 탭하면 해당 나라의 도트가 모두 노란색으로 강조됩니다.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  mapArea: {
    width: "100%",
    aspectRatio: 360 / 145,
    backgroundColor: BG_COLOR,
    overflow: "hidden",
  },
  caption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  captionLabel: {
    color: "#7d8aa6",
    fontSize: 12,
    marginBottom: 8,
  },
  captionHint: {
    color: "#5b6680",
    fontSize: 13,
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
    backgroundColor: "#1c2942",
    borderWidth: 1,
    borderColor: "#2a3a5c",
  },
  optionBtnPressed: {
    backgroundColor: "#2a3a5c",
  },
  optionText: {
    color: "#e8eefc",
    fontSize: 14,
    fontWeight: "600",
  },
  clearText: {
    color: "#7d8aa6",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
